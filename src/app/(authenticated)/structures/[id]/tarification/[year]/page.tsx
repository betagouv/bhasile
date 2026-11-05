import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { getFullStructure } from "@/app/api/structures/structure.service";
import {
  getTarificationJournal,
  getTarificationOverview,
  getTarificationUnreadCounts,
  TarificationOverview,
} from "@/app/api/tarifications/tarification.service";
import { DomainError } from "@/app/utils/domain-error.util";
import { getNow } from "@/app/utils/now.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { TarificationStepCode } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";
import {
  type ActionContext,
  canDeclareOutOfBhasile,
  computeSectionActions,
} from "@/lib/tarification/tarification.actions";
import { buildConversationAnchors } from "@/lib/tarification/tarification.anchor";
import { getCampaignPhase } from "@/lib/tarification/tarification.campaign";
import {
  computeStepProgress,
  getDefaultSectionCode,
  getSectionLabel,
  getSectionSubtitle,
  getSectionVersions,
  parseSectionCode,
} from "@/lib/tarification/tarification.section";
import { filterJournalForOperateur } from "@/lib/tarification/tarification.visibility";
import { tarificationParamsSchema } from "@/schemas/api/message.schema";
import { SessionUser } from "@/types/global";

import { CampaignNotice } from "./_components/CampaignNotice";
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

  const unreadCounts = await getTarificationUnreadCounts({
    structureId,
    year,
    overview,
  });

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

  const now = getNow();
  const phase = getCampaignPhase(year, now, journal.timeZone);
  const isEligible = isStructureAutorisee(structure.type);
  const actionContext: ActionContext = {
    journal,
    author: overview.participant,
    phase,
    isEligible,
    now,
  };

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
        timeZone={journal.timeZone}
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
          subtitle: getSectionSubtitle(step.code),
          status: step.status,
          isLate: step.isLate,
          deadline: step.deadline,
          progress: stepProgress.find(({ code }) => code === step.code)!
            .progress,
        }))}
      />
      <main id="content" className="grow min-w-0 h-dvh flex flex-col">
        <TarificationHeader
          structureId={structureId}
          year={year}
          canDeclareOutOfBhasile={canDeclareOutOfBhasile(actionContext)}
          structure={{
            codeBhasile: structure.codeBhasile,
            nom: structure.nom,
            type: structure.type,
            operateurLabel: structure.operateurLabel,
            communeAdministrative: structure.communeAdministrative,
            departementAdministratif: structure.departementAdministratif,
          }}
        />
        <div className="grow min-h-0 overflow-y-auto flex flex-col gap-4 p-4">
          <CampaignNotice
            year={year}
            phase={phase}
            isEligible={isEligible}
            isOperateur={overview.isOperateur}
            isOutOfBhasile={state.isOutOfBhasile}
          />
          <DocumentPanel
            key={selectedCode}
            structureId={structureId}
            year={year}
            sectionCode={selectedCode}
            actions={computeSectionActions({
              context: actionContext,
              sectionCode: selectedCode,
              versionIds: versions.map(({ id }) => id),
            })}
            hasSharedL48={state.contradictoire.l48DocumentId !== null}
            contradictoireDeadline={state.contradictoire.deadline}
            label={getSectionLabel(selectedCode, year)}
            subtitle={getSectionSubtitle(selectedCode)}
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
            canParticipate={overview.canParticipate}
            isCampaignOpen={overview.openCampaignYears.includes(year)}
            tags={[]}
            unreadCounts={unreadCounts}
            anchorsByVisibility={{
              SHARED: buildConversationAnchors(
                filterJournalForOperateur(journal)
              ),
              AGENTS: buildConversationAnchors(journal),
            }}
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
