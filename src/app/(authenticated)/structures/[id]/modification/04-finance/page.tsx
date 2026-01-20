"use client";
import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { BudgetTables } from "@/app/components/forms/finance/BudgetTables";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
import { IndicateursGeneraux } from "@/app/components/forms/finance/IndicateursGeneraux";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinanceSchema } from "@/schemas/forms/base/budget/getFinanceSchema";
import { anyModificationFinanceFormValues } from "@/schemas/forms/modification/modificationFinance.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { ModificationTitle } from "../components/ModificationTitle";

export default function ModificationFinanceForm() {
  const { structure } = useStructureContext();

  const financeSchema = getFinanceSchema(structure, FormKind.MODIFICATION);

  const defaultValues = getDefaultValues({ structure });

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const onSubmit = async (data: anyModificationFinanceFormValues) => {
    const documentsFinanciers =
      data.documentsFinanciers?.filter(
        (documentFinancier) => documentFinancier.key
      ) ?? [];
    const structureMillesimes = data.structureMillesimes?.map((millesime) => ({
      ...millesime,
      operateurComment: millesime.operateurComment ?? undefined,
    }));
    await handleSubmit({
      ...data,
      documentsFinanciers,
      dnaCode: structure.dnaCode,
      structureMillesimes,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <>
      <ModificationTitle
        step="Finances"
        closeLink={`/structures/${structure.id}`}
      />
      <FormWrapper
        schema={financeSchema}
        defaultValues={defaultValues}
        resetRoute={`/structures/${structure.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        onSubmit={onSubmit}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <DocumentsFinanciers
          className="mb-6"
          hasAccordion
          formKind={FormKind.MODIFICATION}
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
    </>
  );
}
