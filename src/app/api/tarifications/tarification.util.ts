import { DomainError } from "@/app/utils/domain-error.util";
import { getCurrentYear } from "@/app/utils/now.util";

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
