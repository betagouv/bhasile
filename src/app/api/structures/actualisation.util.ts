import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";

import { getActualisationFormSlug } from "../forms/form.constants";

export const getActualisationYear = (): number | null => {
  const raw = process.env.ACTUALISATION_YEAR;
  if (!raw) {
    return null;
  }
  const year = Number(raw);
  return Number.isInteger(year) && year > 0 ? year : null;
};

export const hasOpenActualisation = (
  campaigns: StructureCampaignApiRead[],
  year: number
): boolean =>
  campaigns.some(
    (campaign) =>
      campaign.slug === getActualisationFormSlug(year) && !campaign.isValidated
  );

export const hasValidatedActualisation = (
  campaigns: StructureCampaignApiRead[],
  year: number
): boolean =>
  campaigns.some(
    (campaign) =>
      campaign.slug === getActualisationFormSlug(year) && campaign.isValidated
  );
