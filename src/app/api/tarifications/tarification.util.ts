import { DomainError } from "@/app/utils/domain-error.util";
import { canUpdateStructure } from "@/lib/casl";
import { SessionUser } from "@/types/global";

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
