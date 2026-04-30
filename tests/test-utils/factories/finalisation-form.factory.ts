import { FormApiType } from "@/schemas/api/form.schema";
import { StepStatus } from "@/types/form.type";

export const createAllFinalisationSteps = () => [
  {
    id: 11,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 1,
      label: "01-identification",
      slug: "01-identification",
    },
  },
  {
    id: 12,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 2,
      label: "02-documents-financiers",
      slug: "02-documents-financiers",
    },
  },
  {
    id: 13,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 3,
      label: "03-finance",
      slug: "03-finance",
    },
  },
  {
    id: 14,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 4,
      label: "04-controles",
      slug: "04-controles",
    },
  },
  {
    id: 15,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 5,
      label: "05-documents",
      slug: "05-documents",
    },
  },
  {
    id: 16,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 6,
      label: "06-notes",
      slug: "06-notes",
    },
  },
];

export const createFinalisationForm = (): FormApiType => ({
  id: 1,
  status: false,
  formDefinition: {
    id: 1,
    slug: "finalisation",
    name: "finalisation",
    version: 1,
  },
  formSteps: createAllFinalisationSteps(),
});

export const createDefaultForms = (): FormApiType[] => [
  createFinalisationForm(),
];
