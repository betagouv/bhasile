"use client";

import { useParams } from "next/navigation";
import { z } from "zod";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { DocumentsFinanciers } from "@/app/components/forms/finance/documents/DocumentsFinanciers";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import {
  CAMPAIGN_SAVE_KEY,
  useActualisationFormHandling,
} from "@/app/hooks/useActualisationFormHandling";
import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import {
  DocumentsFinanciersFlexibleFormValues,
  DocumentsFinanciersFlexibleSchema,
  DocumentsFinanciersStrictSchema,
} from "@/schemas/forms/base/documentFinancier.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { ActualisationTabs } from "../_components/ActualisationTabs";

const currentStep = "02-documents-financiers";

export default function ActualisationDocumentsFinanciers() {
  const { structure } = useStructureContext();
  const year = Number(useParams().year);

  const defaultValues = getActualisationDefaultValues({ structure, year });

  const { handleAutoSave, handleValidateStep, backendError } =
    useActualisationFormHandling({ year, currentStep });

  const toDocumentsFinanciers = (
    data: DocumentsFinanciersFlexibleFormValues
  ): DocumentFinancierApiType[] =>
    (data.documentsFinanciers?.filter(
      (documentFinancier) =>
        documentFinancier.fileUploads?.[0]?.key &&
        documentFinancier.category &&
        documentFinancier.granularity
    ) ?? []) as DocumentFinancierApiType[];

  const onAutoSave = async (data: DocumentsFinanciersFlexibleFormValues) => {
    await handleAutoSave(
      { documentsFinanciers: toDocumentsFinanciers(data) },
      DocumentsFinanciersStrictSchema,
      data
    );
  };

  const onSubmit = async (
    data: z.infer<typeof DocumentsFinanciersStrictSchema>
  ) => {
    await handleValidateStep({
      documentsFinanciers: toDocumentsFinanciers(
        data as DocumentsFinanciersFlexibleFormValues
      ),
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState(CAMPAIGN_SAVE_KEY);

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
        <DocumentsFinanciers className="mb-6" formKind={FormKind.ACTUALISATION} />
        {saveState === FetchState.ERROR && (
          <SubmitError
            codeBhasile={structure.codeBhasile}
            backendError={backendError}
          />
        )}
      </FormWrapper>
    </div>
  );
}
