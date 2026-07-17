"use client";
import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { Date303 } from "@/app/components/forms/finance/documents/Date303";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import {
  DocumentsFinanciersFlexibleFormValues,
  DocumentsFinanciersFlexibleSchema,
  DocumentsFinanciersStrictSchema,
} from "@/schemas/forms/base/documentFinancier.schema";
import { StepStatus } from "@/types/form.type";

import { Tabs } from "../_components/Tabs";

export default function FinalisationDocumentsFinanciers() {
  const { structure } = useStructureContext();

  const currentStep = "02-documents-financiers";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const defaultValues = getDefaultValues({ structure });

  const { handleValidation, handleAutoSave } = useAgentFormHandling({
    currentStep,
  });

  const onAutoSave = async (data: DocumentsFinanciersFlexibleFormValues) => {
    const documentsFinanciers = (data.documentsFinanciers?.filter(
      (documentFinancier) =>
        documentFinancier.fileUploads?.[0]?.key && documentFinancier.category
    ) ?? []) as DocumentFinancierApiType[];

    const structureMillesimes = data.structureMillesimes?.map((millesime) => ({
      ...millesime,
      operateurComment: millesime.operateurComment ?? undefined,
    }));

    await handleAutoSave({
      ...data,
      documentsFinanciers,
      id: structure.id,
      structureMillesimes,
    });
  };

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={DocumentsFinanciersStrictSchema}
        defaultValues={defaultValues}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={handleValidation}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave
          schema={DocumentsFinanciersFlexibleSchema}
          onSave={onAutoSave}
        />
        <InformationBar
          variant={
            currentFormStepStatus === StepStatus.VALIDE ? "success" : "verify"
          }
          title={
            currentFormStepStatus === StepStatus.VALIDE
              ? "Vérifié"
              : "À vérifier"
          }
          description="Veuillez vérifier les documents financiers fournis par l’opérateur concernant les cinq dernières années."
        />
        <Date303 />
        <DocumentsFinanciers className="mb-6" />
      </FormWrapper>
    </div>
  );
}
