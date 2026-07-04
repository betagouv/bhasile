import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";

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

    if (response.status >= 400) {
      const result = await response.json();
      return JSON.stringify(result);
    }

    const refreshed = await fetch(`/api/structures/${structureId}`);
    setStructure(await refreshed.json());
    return "OK";
  };

  return { updateAndRefreshCampaign };
};
