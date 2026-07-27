"use client";

import { useParams } from "next/navigation";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { BudgetTables } from "@/app/components/forms/finance/BudgetTables";
import { IndicateursFinanciers } from "@/app/components/forms/finance/IndicateursFinanciers";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useActualisationFormHandling } from "@/app/hooks/useActualisationFormHandling";
import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import {
  BudgetsAutoSaveFormValues,
  budgetsAutoSaveSchema,
} from "@/schemas/forms/base/budget.schema";
import { getFinanceSchema } from "@/schemas/forms/base/budget/getFinanceSchema";

import { ActualisationTabs } from "../_components/ActualisationTabs";

const currentStep = "03-analyse-financiere";

export default function ActualisationAnalyseFinanciere() {
  const { structure } = useStructureContext();
  const year = Number(useParams().year);

  const financeSchema = getFinanceSchema(structure);
  const defaultValues = getActualisationDefaultValues({ structure });

  const { handleAutoSave, handleValidateStep } = useActualisationFormHandling({
    year,
    currentStep,
  });

  const onAutoSave = async (data: BudgetsAutoSaveFormValues) => {
    await handleAutoSave(
      {
        budgets: data.budgets,
        indicateursFinanciers: data.indicateursFinanciers,
      },
      financeSchema,
      data
    );
  };

  const onSubmit = async (data: BudgetsAutoSaveFormValues) => {
    await handleValidateStep({
      budgets: data.budgets,
      indicateursFinanciers: data.indicateursFinanciers,
    });
  };

  return (
    <div>
      <ActualisationTabs currentStep={currentStep} year={year} />
      <FormWrapper
        schema={financeSchema}
        defaultValues={defaultValues}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={onSubmit}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave schema={budgetsAutoSaveSchema} onSave={onAutoSave} />
        <IndicateursFinanciers />
        <hr />
        <BudgetTables />
      </FormWrapper>
    </div>
  );
}
