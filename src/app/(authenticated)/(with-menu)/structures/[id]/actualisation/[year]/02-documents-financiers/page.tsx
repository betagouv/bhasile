"use client";

import { useParams } from "next/navigation";
import { z } from "zod";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useActualisationFormHandling } from "@/app/hooks/useActualisationFormHandling";
import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import { filterDocumentsFinanciersForApi } from "@/app/utils/file-upload.util";
import {
  DocumentsFinanciersFlexibleFormValues,
  DocumentsFinanciersFlexibleSchema,
  DocumentsFinanciersStrictSchema,
} from "@/schemas/forms/base/documentFinancier.schema";
import { FormKind } from "@/types/global";

import { ActualisationTabs } from "../_components/ActualisationTabs";

const currentStep = "02-documents-financiers";

export default function ActualisationDocumentsFinanciers() {
  const { structure } = useStructureContext();
  const year = Number(useParams().year);

  const defaultValues = getActualisationDefaultValues({ structure, year });

  const { handleAutoSave, handleValidateStep } = useActualisationFormHandling({
    year,
    currentStep,
  });

  const onAutoSave = async (data: DocumentsFinanciersFlexibleFormValues) => {
    await handleAutoSave(
      {
        documentsFinanciers: filterDocumentsFinanciersForApi(
          data.documentsFinanciers
        ),
      },
      DocumentsFinanciersStrictSchema,
      data
    );
  };

  const onSubmit = async (
    data: z.infer<typeof DocumentsFinanciersStrictSchema>
  ) => {
    await handleValidateStep({
      documentsFinanciers: filterDocumentsFinanciersForApi(
        (data as DocumentsFinanciersFlexibleFormValues).documentsFinanciers
      ),
    });
  };

  return (
    <div>
      <ActualisationTabs currentStep={currentStep} year={year} />
      <FormWrapper
        schema={DocumentsFinanciersStrictSchema}
        defaultValues={defaultValues}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={onSubmit}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave
          schema={DocumentsFinanciersFlexibleSchema}
          onSave={onAutoSave}
        />
        <DocumentsFinanciers
          className="mb-6"
          formKind={FormKind.ACTUALISATION}
        />
      </FormWrapper>
    </div>
  );
}
