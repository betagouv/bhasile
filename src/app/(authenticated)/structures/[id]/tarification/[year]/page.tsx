import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { getFullStructure } from "@/app/api/structures/structure.service";
import {
  getTarificationJournal,
  getTarificationOverview,
  TarificationOverview,
} from "@/app/api/tarifications/tarification.service";
import { DomainError } from "@/app/utils/domain-error.util";
import { TarificationStepCode } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";
import {
  computeStepProgress,
  getDefaultSectionCode,
  getSectionLabel,
  getSectionVersions,
  parseSectionCode,
} from "@/lib/tarification/tarification.section";
import { tarificationParamsSchema } from "@/schemas/api/message.schema";
import { SessionUser } from "@/types/global";

import { ContradictoireNotice } from "./_components/ContradictoireNotice";
import { DocumentPanel } from "./_components/DocumentPanel";
import { Echanges } from "./_components/Echanges";
import { TarificationHeader } from "./_components/TarificationHeader";
import { TarificationSidebar } from "./_components/TarificationSidebar";

export default async function TarificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; year: string }>;
  searchParams: Promise<{ etape?: string }>;
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
  const user = session.user as SessionUser;

  const overview = await findOverviewOrNotFound(user, structureId);
  if (!overview.campaignYears.includes(year)) {
    notFound();
  }
  const structure = await getFullStructure(structureId, user);
  if (!structure) {
    notFound();
  }

  const reader = { isAgent: !overview.isOperateur };
  const [{ journal, state, drlUrl }, { journal: previousJournal }] =
    await Promise.all([
      getTarificationJournal({ structureId, year, reader }),
      getTarificationJournal({ structureId, year: year - 1, reader }),
    ]);

  const previousDaiVersions = getSectionVersions(previousJournal, "DAI").filter(
    (version) => version.isShared && !version.isWithdrawn
  );
  const requestedCode = parseSectionCode((await searchParams).etape);
  const selectedCode =
    !requestedCode || (requestedCode === "DAI" && !previousDaiVersions.length)
      ? getDefaultSectionCode(state)
      : requestedCode;
  const versions =
    selectedCode === "DAI"
      ? previousDaiVersions
      : getSectionVersions(journal, selectedCode);

  const stepProgress = Object.values(TarificationStepCode).map((code) => ({
    code,
    progress: computeStepProgress(journal, code),
  }));
  const selectedProgress = stepProgress.find(
    ({ code }) => code === selectedCode
  )?.progress;

  return (
    <div className="w-full min-h-screen flex bg-alt-grey">
      <TarificationSidebar
        structureId={structureId}
        year={year}
        campaignYears={overview.campaignYears}
        selectedCode={selectedCode}
        isOperateur={overview.isOperateur}
        drlUrl={drlUrl}
        preliminarySections={[
          {
            code: "CA" as const,
            label: getSectionLabel("CA", year),
            isLate: !!state.deposits.find(({ type }) => type === "CA")?.isLate,
          },
          {
            code: "BP" as const,
            label: getSectionLabel("BP", year),
            isLate: !!state.deposits.find(({ type }) => type === "BP")?.isLate,
          },
          ...(previousDaiVersions.length
            ? [
                {
                  code: "DAI" as const,
                  label: getSectionLabel("DAI", year),
                  isLate: false,
                },
              ]
            : []),
        ]}
        steps={state.steps.map((step) => ({
          code: step.code,
          label: getSectionLabel(step.code, year),
          status: step.status,
          isLate: step.isLate,
          progress: stepProgress.find(({ code }) => code === step.code)!
            .progress,
        }))}
      />
      <main id="content" className="grow min-w-0 flex flex-col">
        <TarificationHeader
          structureId={structureId}
          structure={{
            codeBhasile: structure.codeBhasile,
            nom: structure.nom,
            type: structure.type,
            operateurLabel: structure.operateurLabel,
            communeAdministrative: structure.communeAdministrative,
            departementAdministratif: structure.departementAdministratif,
          }}
        />
        <div className="flex flex-col gap-6 p-4">
          <DocumentPanel
            key={selectedCode}
            label={getSectionLabel(selectedCode, year)}
            versions={versions}
            isOperateur={overview.isOperateur}
            timeZone={journal.timeZone}
            notice={
              selectedCode === "L48" ? (
                <ContradictoireNotice contradictoire={state.contradictoire} />
              ) : undefined
            }
            reviewerNames={
              overview.isOperateur
                ? []
                : (selectedProgress?.reviewers.map(({ name }) => name) ?? [])
            }
          />
          <Echanges
            structureId={structureId}
            year={year}
            currentUserId={overview.participant.id}
            isOperateur={overview.isOperateur}
            isCampaignOpen={overview.openCampaignYears.includes(year)}
            tags={overview.tags}
          />
        </div>
      </main>
    </div>
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
