"use client";
import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { BudgetTables } from "@/app/components/forms/finance/BudgetTables";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
import { IndicateursFinanciers } from "@/app/components/forms/finance/IndicateursFinanciers";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { getFinanceSchema } from "@/schemas/forms/base/budget/getFinanceSchema";
import { anyModificationFinanceFormValues } from "@/schemas/forms/modification/modificationFinance.schema";
import { FormKind } from "@/types/global";

export default function ModificationFinanceForm() {
  const { structure } = useStructureContext();

  const financeSchema = getFinanceSchema(structure, FormKind.MODIFICATION);

  const defaultValues = getDefaultValues({ structure });

  const { handleSubmit } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const onSubmit = async (data: anyModificationFinanceFormValues) => {
    const documentsFinanciers = (data.documentsFinanciers?.filter(
      (documentFinancier) =>
        documentFinancier.fileUploads?.[0]?.key && documentFinancier.category
    ) ?? []) as DocumentFinancierApiType[];

    const structureMillesimes = data.structureMillesimes?.map((millesime) => ({
      ...millesime,
      operateurComment: millesime.operateurComment ?? undefined,
    }));
    await handleSubmit({
      id: structure.id,
      budgets: data.budgets,
      indicateursFinanciers: data.indicateursFinanciers,
      documentsFinanciers,
      structureMillesimes,
    });
  };

  return (
    <>
      <ModificationTitle
        step="Finances"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={financeSchema}
        defaultValues={defaultValues}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        onSubmit={onSubmit}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <DocumentsFinanciers className="mb-6" hasAccordion />
        <IndicateursFinanciers />
        <hr />

        <BudgetTables />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
