import { toLocalDate } from "@/lib/tarification/tarification.date";
import { TARIFICATION_FIRST_CAMPAIGN_YEAR } from "@/lib/tarification/tarification.definition";
import type { CampaignPhase } from "@/types/tarification.type";

// Ouverte du 1er janvier N-1 au 31 décembre N, puis rattrapage sans limite de durée
export const getCampaignPhase = (
  year: number,
  now: Date,
  timeZone: string
): CampaignPhase => {
  const today = toLocalDate(now, timeZone);
  if (today < `${year - 1}-01-01`) {
    return "UPCOMING";
  }
  return today <= `${year}-12-31` ? "OPEN" : "CATCH_UP";
};

export const getOpenCampaignYears = (now: Date, timeZone: string): number[] => {
  const localYear = Number(toLocalDate(now, timeZone).slice(0, 4));
  return [localYear, localYear + 1];
};

export const getCatchUpCampaignYears = (
  now: Date,
  timeZone: string
): number[] => {
  const localYear = Number(toLocalDate(now, timeZone).slice(0, 4));
  return Array.from(
    { length: Math.max(localYear - TARIFICATION_FIRST_CAMPAIGN_YEAR, 0) },
    (_value, index) => TARIFICATION_FIRST_CAMPAIGN_YEAR + index
  );
};
