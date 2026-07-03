import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";

import { getResolvedStructure } from "../structures/structure.service";
import { updateActualisationCampaign } from "./campaign.repository";

export const saveActualisationCampaign = async (
  input: CampaignApiWrite
): Promise<StructureCampaignApiRead> => {
  const structure = await getResolvedStructure(input.structureId);
  if (!structure) {
    throw new Error(`Structure ${input.structureId} introuvable`);
  }
  return updateActualisationCampaign(input, structure);
};
