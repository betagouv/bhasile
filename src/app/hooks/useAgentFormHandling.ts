import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StructureAgentUpdateApiClient } from "@/schemas/api/structure.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { useFetchState } from "../context/FetchStateContext";
import { ApiError } from "../utils/apiError.util";
import {
  FINALISATION_FORM_LABEL,
  FINALISATION_FORM_VERSION,
  getFinalisationForm,
  getFinalisationFormNextStepToValidate,
} from "../utils/finalisationForm.util";
import { useStructures } from "./useStructures";

export const useAgentFormHandling = ({
  nextRoute,
  currentStep,
}: Props = {}) => {
  const router = useRouter();

  const { structure, setStructure } = useStructureContext();

  const { updateAndRefreshStructure } = useStructures();

  const { setFetchState } = useFetchState();

  const updateStructure = async (
    data: StructureAgentUpdateApiClient
  ): Promise<boolean> => {
    setFetchState("structure-save", FetchState.LOADING);

    try {
      await updateAndRefreshStructure(structure.id, data, setStructure);
      setFetchState("structure-save", FetchState.IDLE);
      return true;
    } catch (error) {
      setFetchState(
        "structure-save",
        FetchState.ERROR,
        error instanceof ApiError ? error.message : undefined
      );
      return false;
    }
  };

  const handleAutoSave = async (data: StructureAgentUpdateApiClient) => {
    await updateStructure(data);
  };

  const handleValidation = async () => {
    const forms = structure.forms?.map((form) => {
      if (
        form.formDefinition.name === FINALISATION_FORM_LABEL &&
        form.formDefinition.version === FINALISATION_FORM_VERSION
      ) {
        return {
          ...form,
          formSteps: form.formSteps.map((formStep) => {
            if (formStep.stepDefinition.label === currentStep) {
              return {
                ...formStep,
                status: StepStatus.VALIDE,
              };
            } else {
              return formStep;
            }
          }),
        };
      } else {
        return form;
      }
    });

    const saved = await updateStructure({
      id: structure.id,
      forms,
    });
    if (!saved) {
      return;
    }

    const nextStepToValidate = getFinalisationFormNextStepToValidate(
      structure,
      currentStep
    );

    if (nextStepToValidate) {
      router.push(nextStepToValidate.stepDefinition.slug);
    } else {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleFinalisation = async () => {
    const forms = structure.forms?.map((form) => {
      if (
        form.formDefinition.name === FINALISATION_FORM_LABEL &&
        form.formDefinition.version === FINALISATION_FORM_VERSION
      ) {
        return {
          ...form,
          status: true,
        };
      } else {
        return form;
      }
    });

    return updateStructure({
      id: structure.id,
      forms,
    });
  };

  const handleSubmit = async (data: StructureAgentUpdateApiClient) => {
    const saved = await updateStructure(data);
    if (saved && nextRoute) {
      router.push(nextRoute);
    }
  };

  const [isStructureReadyToFinalise, setIsStructureReadyToFinalise] =
    useState(false);

  useEffect(() => {
    const finalisationForm = getFinalisationForm(structure);

    const isFinalisationFormCompleted =
      finalisationForm?.formSteps?.every(
        (step) => step.status === StepStatus.VALIDE
      ) || false;

    setIsStructureReadyToFinalise(isFinalisationFormCompleted);
  }, [structure]);

  return {
    handleSubmit,
    handleAutoSave,
    handleValidation,
    handleFinalisation,
    isStructureReadyToFinalise,
  };
};

export type Props = {
  nextRoute?: string;
  currentStep?: string;
};
