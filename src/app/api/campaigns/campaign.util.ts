import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";

import { actualisationCampaignDefinitionSlug } from "./campaign.constants";

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
      campaign.slug === actualisationCampaignDefinitionSlug(year) &&
      !campaign.isValidated
  );
