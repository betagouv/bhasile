import { ReactNode } from "react";

import { FormStepTab } from "@/app/components/forms/stepper/FormStepTab";
import {
  ACTUALISATION_STEPS,
  getActualisationFormStepStatus,
} from "@/app/utils/actualisationForm.util";

import { useStructureContext } from "../../../_context/StructureClientContext";

const titles: Record<string, ReactNode> = {
  "01-places": <>Places</>,
  "02-documents-financiers": (
    <>
      Documents
      <br />
      financiers
    </>
  ),
  "03-analyse-financiere": (
    <>
      Analyse
      <br />
      financière
    </>
  ),
  "04-actes-administratifs": (
    <>
      Actes
      <br />
      administratifs
    </>
  ),
};

export const ActualisationTabs = ({ currentStep, year }: Props) => {
  const { structure } = useStructureContext();

  return (
    <div className="grid grid-cols-4 gap-1 mb-[-1px]">
      {ACTUALISATION_STEPS.map((step) => (
        <FormStepTab
          key={step.route}
          title={titles[step.route]}
          href={`/structures/${structure.id}/actualisation/${year}/${step.route}`}
          current={step.route === currentStep}
          status={getActualisationFormStepStatus(step.route, structure, year)}
          validatedLabel="COMPLÉTÉ"
        />
      ))}
    </div>
  );
};

type Props = {
  currentStep: string;
  year: number;
};
