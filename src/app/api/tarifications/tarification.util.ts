import { DomainError } from "@/app/utils/domain-error.util";
import { CURRENT_YEAR } from "@/constants";

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

export const assertCanWrite = (participant: {
  isSuperAdmin: boolean;
}): void => {
  if (participant.isSuperAdmin) {
    throw new DomainError(
      "Les superadmins consultent les échanges sans y écrire",
      403
    );
  }
};
