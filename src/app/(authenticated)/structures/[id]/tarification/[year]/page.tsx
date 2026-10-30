import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  getTarificationOverview,
  TarificationOverview,
} from "@/app/api/tarifications/tarification.service";
import { isCampaignOpen } from "@/app/api/tarifications/tarification.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { authOptions } from "@/lib/next-auth/auth";
import { tarificationParamsSchema } from "@/schemas/api/message.schema";
import { SessionUser } from "@/types/global";

import { Echanges } from "./_components/Echanges";
import { TarificationHeader } from "./_components/TarificationHeader";

export default async function TarificationPage({
  params,
}: {
  params: Promise<{ id: string; year: string }>;
}) {
  const { id, year: rawYear } = await params;
  const parsedParams = tarificationParamsSchema.safeParse({
    structureId: id,
    year: rawYear,
  });
  if (!parsedParams.success) {
    notFound();
  }
  const { structureId, year } = parsedParams.data;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    notFound();
  }

  const overview = await findOverviewOrNotFound(
    session.user as SessionUser,
    structureId
  );
  if (!overview.campaignYears.includes(year)) {
    notFound();
  }

  return (
    <main
      className="w-full min-h-screen flex flex-col bg-alt-grey"
      id="content"
    >
      <TarificationHeader
        structureId={structureId}
        codeBhasile={overview.codeBhasile}
        year={year}
        campaignYears={overview.campaignYears}
      />
      <div className="w-full max-w-4xl mx-auto px-3 py-6">
        <Echanges
          structureId={structureId}
          year={year}
          currentUserId={overview.participant.id}
          isOperateur={overview.isOperateur}
          isCampaignOpen={isCampaignOpen(year)}
          tags={overview.tags}
        />
      </div>
    </main>
  );
}

const findOverviewOrNotFound = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationOverview> => {
  try {
    return await getTarificationOverview(user, structureId);
  } catch (error) {
    if (error instanceof DomainError) {
      notFound();
    }
    throw error;
  }
};
