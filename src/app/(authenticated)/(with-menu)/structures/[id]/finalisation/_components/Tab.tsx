import { ReactNode } from "react";

import { FormStepTab } from "@/app/components/forms/stepper/FormStepTab";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const Tab = ({ title, route, current, type }: Props) => {
  const { structure } = useStructureContext();

  const status = getFinalisationFormStepStatus(route, structure);

  return (
    <FormStepTab
      title={title}
      href={`/structures/${structure.id}/finalisation/${route}`}
      current={current}
      status={status}
      validatedLabel={type === "verification" ? "VÉRIFIÉ" : "COMPLÉTÉ"}
    />
  );
};

type Props = {
  title: ReactNode;
  route: string;
  current: boolean;
  type: "verification" | "completion";
};
