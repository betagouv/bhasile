"use client";

import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/structures/(structure)/[id]/_context/StructureClientContext";
import { CustomNotice } from "@/app/components/common/CustomNotice";
import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { transformAgentFormContactsToApiContacts } from "@/app/utils/contacts.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import {
  ModificationDescriptionFormValues,
  modificationDescriptionSchema,
} from "@/schemas/forms/modification/modificationDescription.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

export default function ModificationDescription() {
  const { structure } = useStructureContext();

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({ structure });

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  const onSubmit = (data: ModificationDescriptionFormValues) => {
    handleSubmit({
      ...data,
      id: structure.id,
      contacts: transformAgentFormContactsToApiContacts(data.contacts),
    });
  };
  return (
    <>
      <ModificationTitle
        step="Description"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={modificationDescriptionSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        mode="onChange"
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <CustomNotice
          severity="warning"
          title=""
          description={`Certaines données (date de création, code DNA, type de structure, opérateur) ne sont pas modifiables. Il y a une erreur ? Contactez-nous : ${BHASILE_CONTACT_EMAIL}`}
        />
        <FieldSetDescription formKind={FormKind.MODIFICATION} />
        <hr />
        <AdresseAdministrativeAndAntennes />
        <hr />
        <DnaAndFiness formKind={FormKind.MODIFICATION} />
        <hr />
        <FieldSetContacts />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
      {saveState === FetchState.ERROR && (
        <SubmitError
          codeBhasile={structure.codeBhasile}
          backendError={backendError}
        />
      )}
    </>
  );
}
