import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";

import { updateActualisationCampaign } from "./campaign.repository";

export const saveActualisationCampaign = async (
  input: CampaignApiWrite
): Promise<StructureCampaignApiRead> => {
  return updateActualisationCampaign(input);
};
