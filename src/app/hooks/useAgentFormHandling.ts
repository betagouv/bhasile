import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { useFetchState } from "../context/FetchStateContext";
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

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const updateStructure = async (
    data: StructureAgentUpdateApiType
  ): Promise<void> => {
    setFetchState("structure-save", FetchState.LOADING);

    try {
      const result = await updateAndRefreshStructure(
        structure.id,
        data,
        setStructure
      );

      if (result !== "OK") {
        throw new Error(result?.toString());
      }

      setFetchState("structure-save", FetchState.IDLE);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      setFetchState("structure-save", FetchState.ERROR);
      setBackendError(errorMessage);
      throw error;
    }
  };

  const handleAutoSave = async (data: StructureAgentUpdateApiType) => {
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

    await updateStructure({
      id: structure.id,
      forms,
    });

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

    await updateStructure({
      id: structure.id,
      forms,
    });
  };

  const handleSubmit = async (data: StructureAgentUpdateApiType) => {
    await updateStructure(data);
    if (nextRoute) {
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
    backendError,
    isStructureReadyToFinalise,
  };
};

export type Props = {
  nextRoute?: string;
  currentStep?: string;
};
