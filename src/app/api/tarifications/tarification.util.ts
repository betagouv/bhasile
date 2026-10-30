import type { UserWithGrants } from "@/app/api/users/user.db.type";
import {
  getAssignedGrants,
  isAgentUser,
  toSessionGrant,
} from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { getCurrentYear } from "@/app/utils/now.util";
import { VISIBILITY_LABELS } from "@/constants";
import { GrantScope, Visibility } from "@/generated/prisma/enums";
import { canAccessTarification } from "@/lib/casl";
import type { NotificationRecipient } from "@/types/conversation.type";
import type { SessionPermissions } from "@/types/global";

// La campagne N est ouverte du 1er janvier N-1 au 31 décembre N
export const getOpenCampaignYears = (): number[] => {
  const currentYear = getCurrentYear();
  return [currentYear, currentYear + 1];
};

export const getSelectableCampaignYears = (
  tarificationYears: number[]
): number[] =>
  [...new Set([...getOpenCampaignYears(), ...tarificationYears])].sort(
    (firstYear, secondYear) => secondYear - firstYear
  );

export const isCampaignOpen = (year: number): boolean =>
  getOpenCampaignYears().includes(year);

export const assertCampaignOpen = (year: number): void => {
  if (!isCampaignOpen(year)) {
    throw new DomainError(
      `La campagne ${year} n'est pas ouverte : ses échanges sont en lecture seule`,
      409
    );
  }
};

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
