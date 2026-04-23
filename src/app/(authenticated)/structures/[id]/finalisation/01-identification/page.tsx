"use client";
import { ReactElement } from "react";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { AutoSave } from "@/app/components/forms/AutoSave";
import { FieldSetCalendrier } from "@/app/components/forms/calendrier/FieldSetCalendrier";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetTypePlaces } from "@/app/components/forms/typePlace/FieldSetTypePlaces";
import { SubmitError } from "@/app/components/SubmitError";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { transformAgentFormContactsToApiContacts } from "@/app/utils/contacts.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import {
  FinalisationIdentificationAutoSaveFormValues,
  finalisationIdentificationAutoSaveSchema,
  finalisationIdentificationSchema,
} from "@/schemas/forms/finalisation/finalisationIdentification.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Tabs } from "../_components/Tabs";

export default function FinalisationIdentification(): ReactElement {
  const { structure } = useStructureContext();

  const currentStep = "01-identification";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const defaultValues = getDefaultValues({ structure });

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({ currentStep });

  const onAutoSave = async (
    data: FinalisationIdentificationAutoSaveFormValues
  ) => {
    const contacts = transformAgentFormContactsToApiContacts(data.contacts);
    await handleAutoSave({ ...data, contacts, id: structure.id });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={finalisationIdentificationSchema}
        defaultValues={defaultValues}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={handleValidation}
        mode="onBlur"
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave
          schema={finalisationIdentificationAutoSaveSchema}
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
          description="Veuillez vérifier les informations suivantes transmises par l’opérateur."
        />

        <FieldSetDescription />
        <hr />

        <AdresseAdministrativeAndAntennes />
        <hr />

        <DnaAndFiness />
        <hr />

        <FieldSetContacts />
        <hr />

        <FieldSetCalendrier />
        <hr />

        <FieldSetTypePlaces
          structure={structure}
          formKind={FormKind.FINALISATION}
        />

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
