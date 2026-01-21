"use client";
import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { Date303 } from "@/app/components/forms/finance/documents/Date303";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
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
  DocumentsFinanciersFlexibleFormValues,
  DocumentsFinanciersFlexibleSchema,
  DocumentsFinanciersStrictSchema,
} from "@/schemas/forms/base/documentFinancier.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";

import { Tabs } from "../_components/Tabs";

export default function FinalisationDocumentsFinanciers() {
  const { structure } = useStructureContext();

  const currentStep = "02-documents-financiers";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const defaultValues = getDefaultValues({ structure });

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({ currentStep });

  const onAutoSave = async (data: DocumentsFinanciersFlexibleFormValues) => {
    const documentsFinanciers =
      data.documentsFinanciers?.filter(
        (documentFinancier) => documentFinancier.key
      ) ?? [];
    const structureMillesimes = data.structureMillesimes?.map((millesime) => ({
      ...millesime,
      operateurComment: millesime.operateurComment ?? undefined,
    }));
    await handleAutoSave({
      ...data,
      documentsFinanciers,
      dnaCode: structure.dnaCode,
      structureMillesimes,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

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
        <DocumentsFinanciers
          className="mb-6"
          formKind={FormKind.FINALISATION}
        />

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
