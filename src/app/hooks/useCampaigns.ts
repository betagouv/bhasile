import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import { extractApiError } from "../utils/apiError.util";

export const useCampaigns = () => {
  const updateAndRefreshCampaign = async (
    structureId: number,
    payload: CampaignApiWrite,
    setStructure: (structure: StructureApiRead) => void
  ): Promise<string> => {
    const response = await fetch("/api/campaigns", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return await extractApiError(response);
    }

    const refreshed = await fetch(`/api/structures/${structureId}`);
    if (!refreshed.ok) {
      return await extractApiError(refreshed);
    }
    setStructure(await refreshed.json());
    return "OK";
  };

  return { updateAndRefreshCampaign };
};
