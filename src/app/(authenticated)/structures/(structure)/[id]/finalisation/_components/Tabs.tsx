import { ReactNode } from "react";

import { FINALISATION_STEPS } from "@/app/utils/finalisationForm.util";

import { Tab } from "./Tab";

export const steps: Record<string, ReactNode> = {
  "01-identification": (
    <>
      Identification
      <br />
      de la structure
    </>
  ),
  "02-documents-financiers": (
    <>
      Documents
      <br />
      financiers
    </>
  ),
  "03-finance": (
    <>
      Analyse
      <br />
      Financière
    </>
  ),
  "04-controles": (
    <>
      Contrôle qualité
      <br />
      et objectifs
    </>
  ),
  "05-documents": (
    <>
      Actes
      <br />
      administratifs
    </>
  ),
  "06-notes": <>Notes</>,
};

export const Tabs = ({ currentStep }: Props) => {
  return (
    <div className="grid grid-cols-6 gap-1 mb-[-1px]">
      {FINALISATION_STEPS.map((step) => (
        <Tab
          key={step.route}
          title={steps[step.route]}
          type={step.type}
          route={step.route}
          current={step.route === currentStep}
        />
      ))}
    </div>
  );
};

type Props = {
  currentStep: string;
};
