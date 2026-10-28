import { DomainError } from "@/app/utils/domain-error.util";
import { CURRENT_YEAR } from "@/constants";
import { canUpdateStructure } from "@/lib/casl";
import { SessionUser } from "@/types/global";

// La campagne N est ouverte du 1er janvier N-1 au 31 décembre N
export const getOpenCampaignYears = (): number[] => [
  CURRENT_YEAR,
  CURRENT_YEAR + 1,
];

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

// Les grants nationaux n'ouvrent pas la tarification, même en édition
export const canAccessTarification = (
  user: SessionUser,
  structure: {
    id: number;
    departementAdministratif: string;
    operateurId: number | null;
  }
): boolean =>
  canUpdateStructure(
    { ...user, grants: user.grants.filter((grant) => !grant.isNational) },
    structure
  );
