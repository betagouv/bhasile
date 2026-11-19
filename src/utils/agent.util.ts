import { AccountStatus } from "@/app/api/users/user.util";

export const AGENT_STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: "En attente",
  ACTIVATED: "Actif",
  DEACTIVATED: "Désactivé",
};

export const describeAgentAccess = (
  status: AccountStatus,
  perimeter: { name: string } | null
): string =>
  [AGENT_STATUS_LABELS[status], perimeter?.name].filter(Boolean).join(" · ");
