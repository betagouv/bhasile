import { useRouter } from "next/navigation";
import { z } from "zod";

import { StructureAgentUpdateApiClient } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { getActualisationFormSlug } from "../api/forms/form.constants";
import { getActualisationNextRoute } from "../utils/actualisationForm.util";
import { useSaveMutation } from "./useSaveMutation";
import { useStructures } from "./useStructures";

export const ACTUALISATION_SAVE_KEY = "actualisation-save";

type ActualisationData = Pick<
  StructureAgentUpdateApiClient,
  | "structureTypologies"
  | "budgets"
  | "indicateursFinanciers"
  | "documentsFinanciers"
  | "actesAdministratifs"
>;

export const useActualisationFormHandling = ({ year, currentStep }: Props) => {
  const router = useRouter();
  const { structure, setStructure } = useStructureContext();
  const { updateActualisation } = useStructures();
  const { mutate } = useSaveMutation(
    ACTUALISATION_SAVE_KEY,
    (payload: unknown) =>
      updateActualisation(structure.id, payload, setStructure)
  );

  const slug = getActualisationFormSlug(year);

  const buildForms = (options: {
    currentStepStatus?: StepStatus;
    validate?: boolean;
  }) =>
    structure.forms
      ?.filter((form) => form.formDefinition.slug === slug)
      .map((form) => ({
        ...form,
        ...(options.validate ? { status: true } : {}),
        formSteps: form.formSteps.map((formStep) =>
          options.currentStepStatus !== undefined &&
          formStep.stepDefinition.slug === currentStep
            ? { ...formStep, status: options.currentStepStatus }
            : formStep
        ),
      }));

  const handleAutoSave = async (
    data: ActualisationData,
    strictSchema: z.ZodTypeAny,
    values: unknown
  ): Promise<void> => {
    const currentStepStatus = strictSchema.safeParse(values).success
      ? StepStatus.VALIDE
      : StepStatus.NON_COMMENCE;
    await mutate({
      id: structure.id,
      ...data,
      forms: buildForms({ currentStepStatus }),
    });
  };

  const handleValidateStep = async (data: ActualisationData): Promise<void> => {
    const result = await mutate({
      id: structure.id,
      ...data,
      forms: buildForms({ currentStepStatus: StepStatus.VALIDE }),
    });
    if (result === null) {
      return;
    }

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
    await mutate({ id: structure.id, forms: buildForms({ validate: true }) });
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
