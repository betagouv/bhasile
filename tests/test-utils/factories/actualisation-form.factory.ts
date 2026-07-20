import { ACTUALISATION_FORM_STEP_SLUGS } from "@/app/api/forms/form.constants";
import { FormApiType } from "@/schemas/api/form.schema";
import { StepStatus } from "@/types/form.type";

// Form d'actualisation d'une année (pré-créé par le script) : le hook client mappe
// ce form existant pour poser le statut de progression.
export const createActualisationForm = (
  year: number,
  status = false
): FormApiType => ({
  id: 10,
  status,
  formDefinition: {
    id: 20,
    slug: `actualisation-${year}`,
    name: `Actualisation ${year}`,
    version: 1,
  },
  formSteps: ACTUALISATION_FORM_STEP_SLUGS.map((slug, index) => ({
    id: 100 + index,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: { id: 200 + index, slug, label: slug },
  })),
});
