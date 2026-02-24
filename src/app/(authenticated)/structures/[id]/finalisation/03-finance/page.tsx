"use client";

import { ReactElement } from "react";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { BudgetTables } from "@/app/components/forms/finance/BudgetTables";
import { IndicateursGeneraux } from "@/app/components/forms/finance/IndicateursGeneraux";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SubmitError } from "@/app/components/SubmitError";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import {
  BudgetsAutoSaveFormValues,
  budgetsAutoSaveSchema,
} from "@/schemas/forms/base/budget.schema";
import { getFinanceSchema } from "@/schemas/forms/base/budget/getFinanceSchema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

import { Tabs } from "../_components/Tabs";

export default function FinalisationFinance(): ReactElement {
  const { structure } = useStructureContext();

  const currentStep = "03-finance";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const financeSchema = getFinanceSchema(structure);

  const defaultValues = getDefaultValues({ structure });

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({ currentStep });

  const onAutoSave = async (data: BudgetsAutoSaveFormValues) => {
    await handleAutoSave({ budgets: data.budgets, dnaCode: structure.dnaCode });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={financeSchema}
        defaultValues={defaultValues}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={handleValidation}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave schema={budgetsAutoSaveSchema} onSave={onAutoSave} />

        <InformationBar
          variant={
            currentFormStepStatus === StepStatus.VALIDE ? "success" : "complete"
          }
          title={
            currentFormStepStatus === StepStatus.VALIDE
              ? "Complété"
              : "À compléter"
          }
          description="Veuillez remplir les champs obligatoires ci-dessous. Si une donnée vous est inconnue, contactez-nous."
        />

        <IndicateursGeneraux />
        <hr />

        <BudgetTables />
        {saveState === FetchState.ERROR && (
          <SubmitError
            structureDnaCode={structure.dnaCode}
            backendError={backendError}
          />
        )}
      </FormWrapper>
    </div>
  );
}
