import { useRouter } from "next/navigation";
import { z } from "zod";

import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { useFetchState } from "../context/FetchStateContext";
import { getActualisationNextRoute } from "../utils/actualisationForm.util";
import { useCampaigns } from "./useCampaigns";

export const CAMPAIGN_SAVE_KEY = "campaign-save";

type CampaignDataSlice = Omit<
  CampaignApiWrite,
  "structureId" | "year" | "step" | "validate"
>;

export const useActualisationFormHandling = ({ year, currentStep }: Props) => {
  const router = useRouter();
  const { structure, setStructure } = useStructureContext();
  const { updateAndRefreshCampaign } = useCampaigns();
  const { setFetchState } = useFetchState();

  const save = async (payload: CampaignApiWrite): Promise<void> => {
    setFetchState(CAMPAIGN_SAVE_KEY, FetchState.LOADING);
    try {
      const result = await updateAndRefreshCampaign(
        structure.id,
        payload,
        setStructure
      );
      if (result !== "OK") {
        throw new Error(result);
      }
      setFetchState(CAMPAIGN_SAVE_KEY, FetchState.IDLE);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      setFetchState(CAMPAIGN_SAVE_KEY, FetchState.ERROR, message);
      throw error;
    }
  };

  const handleAutoSave = async (
    data: CampaignDataSlice,
    strictSchema: z.ZodTypeAny,
    values: unknown
  ): Promise<void> => {
    const status = strictSchema.safeParse(values).success
      ? StepStatus.VALIDE
      : StepStatus.NON_COMMENCE;

    await save({
      structureId: structure.id,
      year,
      ...data,
      ...(currentStep ? { step: { slug: currentStep, status } } : {}),
    });
  };

  const handleValidateStep = async (data: CampaignDataSlice): Promise<void> => {
    await save({
      structureId: structure.id,
      year,
      ...data,
      ...(currentStep
        ? { step: { slug: currentStep, status: StepStatus.VALIDE } }
        : {}),
    });

    const nextRoute = currentStep
      ? getActualisationNextRoute(currentStep)
      : undefined;

    if (nextRoute) {
      router.push(
        `/structures/${structure.id}/actualisation/${year}/${nextRoute}`
      );
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleValidateActualisation = async (): Promise<void> => {
    await save({ structureId: structure.id, year, validate: true });
  };

  return {
    handleAutoSave,
    handleValidateStep,
    handleValidateActualisation,
  };
};

type Props = {
  year: number;
  currentStep?: string;
};
