import type { UserWithGrants } from "@/app/api/users/user.db.type";
import {
  getAssignedGrants,
  isAgentUser,
  toSessionGrant,
} from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { getNow } from "@/app/utils/now.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { VISIBILITY_LABELS } from "@/constants";
import {
  GrantScope,
  type StructureType,
  Visibility,
} from "@/generated/prisma/enums";
import { canAccessTarification } from "@/lib/casl";
import { getCampaignPhase } from "@/lib/tarification/tarification.campaign";
import { getDepartementTimeZone } from "@/lib/tarification/tarification.date";
import type { NotificationRecipient } from "@/types/conversation.type";
import type { SessionPermissions } from "@/types/global";

export const getSelectableCampaignYears = ({
  openCampaignYears,
  catchUpCampaignYears,
  tarificationYears,
}: {
  openCampaignYears: number[];
  catchUpCampaignYears: number[];
  tarificationYears: number[];
}): number[] =>
  [
    ...new Set([
      ...openCampaignYears,
      ...catchUpCampaignYears,
      ...tarificationYears,
    ]),
  ].sort((firstYear, secondYear) => secondYear - firstYear);

export const assertStructureEligible = (structure: {
  type: StructureType | null;
}): void => {
  if (!isStructureAutorisee(structure.type)) {
    throw new DomainError(
      "Seuls les CADA et les CPH ont une tarification",
      409
    );
  }
};

export const assertCampaignOpen = (
  year: number,
  structure: { departementAdministratif: string }
): void => {
  const timeZone = getDepartementTimeZone(structure.departementAdministratif);
  if (getCampaignPhase(year, getNow(), timeZone) !== "OPEN") {
    throw new DomainError(
      `La campagne ${year} n'est pas ouverte : ses échanges sont en lecture seule`,
      409
    );
  }
};

const NOTIFICATION_PARIS_HOURS = [8, 14];

// REGION exclu : la DDETS mène les échanges. Opérateurs exclus tant qu'ils n'ont pas accès à la messagerie
export const getMessageRecipients = (
  users: (UserWithGrants & { email: string })[],
  {
    structure,
    authorId,
  }: {
    structure: { id: number; departementAdministratif: string };
    authorId: number;
  }
): NotificationRecipient[] =>
  users
    .filter(
      (user) =>
        user.id !== authorId &&
        !user.isSuperAdmin &&
        isAgentUser(user) &&
        canAccessTarification(toRecipientPermissions(user), structure)
    )
    .map((user) => ({ userId: user.id, email: user.email }));

// Scalingo ne planifie qu'en UTC : le cron passe aux heures UTC de l'hiver et de l'été, et ne garde que les bonnes
export const isNotificationHour = (now: Date): boolean =>
  NOTIFICATION_PARIS_HOURS.includes(
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now)
    )
  );

export const buildNotificationParams = ({
  structure,
  year,
  visibility,
}: {
  structure: { id: number; codeBhasile: string };
  year: number;
  visibility: Visibility;
}): Record<string, string> => {
  if (!process.env.NEXT_URL) {
    throw new Error(
      "NEXT_URL manquant : impossible de construire le lien du mail"
    );
  }
  const channelQuery = visibility === Visibility.AGENTS ? "?canal=agents" : "";
  return {
    structure: structure.codeBhasile,
    campagne: String(year),
    canal: VISIBILITY_LABELS[visibility],
    lien: `${process.env.NEXT_URL}/structures/${structure.id}/tarification/${year}${channelQuery}`,
  };
};

const toRecipientPermissions = (user: UserWithGrants): SessionPermissions => ({
  operateurId: user.operateurId,
  isSuperAdmin: false,
  isAgent: true,
  grants: getAssignedGrants(user)
    .filter((grant) => grant.scope !== GrantScope.REGION)
    .map(toSessionGrant),
});
