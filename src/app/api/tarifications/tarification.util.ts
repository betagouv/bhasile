import { DomainError } from "@/app/utils/domain-error.util";

const PARIS_YEAR_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  year: "numeric",
});

// La campagne N est ouverte du 1er janvier N-1 au 31 décembre N (heure de Paris)
export const getOpenCampaignYears = (now: Date): number[] => {
  const currentYear = Number(PARIS_YEAR_FORMAT.format(now));
  return [currentYear, currentYear + 1];
};

export const isCampaignOpen = (year: number, now: Date): boolean =>
  getOpenCampaignYears(now).includes(year);

export const assertCampaignOpen = (year: number, now: Date): void => {
  if (!isCampaignOpen(year, now)) {
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
