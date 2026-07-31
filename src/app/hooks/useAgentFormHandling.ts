import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { areAllFormStepsValidated } from "@/app/utils/formStep.util";
import { StructureAgentUpdateApiClient } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import {
  FINALISATION_FORM_LABEL,
  FINALISATION_FORM_VERSION,
  getFinalisationForm,
  getFinalisationFormNextStepToValidate,
} from "../utils/finalisationForm.util";
import { useSaveMutation } from "./useSaveMutation";
import { useStructures } from "./useStructures";

export const useAgentFormHandling = ({
  nextRoute,
  currentStep,
}: Props = {}) => {
  const router = useRouter();

  const { structure, setStructure } = useStructureContext();

  const { updateAndRefreshStructure } = useStructures();

  const { mutate: saveStructure } = useSaveMutation(
    "structure-save",
    (data: StructureAgentUpdateApiClient) =>
      updateAndRefreshStructure(structure.id, data, setStructure)
  );

  const handleAutoSave = async (data: StructureAgentUpdateApiClient) => {
    await saveStructure(data);
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

    const result = await saveStructure({
      id: structure.id,
      forms,
    });
    if (result === null) {
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

    const result = await saveStructure({
      id: structure.id,
      forms,
    });
    return result !== null;
  };

  const handleSubmit = async (data: StructureAgentUpdateApiClient) => {
    const result = await saveStructure(data);
    if (result !== null && nextRoute) {
      router.push(nextRoute);
    }
  };

  const [isStructureReadyToFinalise, setIsStructureReadyToFinalise] =
    useState(false);

  useEffect(() => {
    const finalisationForm = getFinalisationForm(structure);

    const isFinalisationFormCompleted = areAllFormStepsValidated(
      finalisationForm?.formSteps
    );

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
