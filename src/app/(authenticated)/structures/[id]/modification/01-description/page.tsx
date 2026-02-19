"use client";

import Notice from "@codegouvfr/react-dsfr/Notice";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { FieldSetAdresseAdministrative } from "@/app/components/forms/fieldsets/structure/FieldSetAdresseAdministrative";
import { FieldSetContacts } from "@/app/components/forms/fieldsets/structure/FieldSetContacts";
import { FieldSetDescription } from "@/app/components/forms/fieldsets/structure/FieldSetDescription";
import { FieldSetHebergement } from "@/app/components/forms/fieldsets/structure/FieldSetHebergement";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { transformFormAdressesToApiAdresses } from "@/app/utils/adresse.util";
import { transformAgentFormContactsToApiContacts } from "@/app/utils/contacts.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import {
  ModificationDescriptionFormValues,
  modificationDescriptionSchema,
} from "@/schemas/forms/modification/modificationDescription.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { ModificationTitle } from "../components/ModificationTitle";

export default function ModificationDescription() {
  const { structure } = useStructureContext();

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const defaultValues = getDefaultValues({ structure });

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  const onSubmit = (data: ModificationDescriptionFormValues) => {
    handleSubmit({
      ...data,
      adresses: transformFormAdressesToApiAdresses(data.adresses),
      contacts: transformAgentFormContactsToApiContacts(data.contacts),
    });
  };
  return (
    <>
      <ModificationTitle
        step="Description"
        closeLink={`/structures/${structure.id}`}
      />
      <FormWrapper
        schema={modificationDescriptionSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        mode="onChange"
        resetRoute={`/structures/${structure.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <Notice
          severity="warning"
          title=""
          description={`Certaines données (date de création, code DNA, type de structure, opérateur) ne sont pas modifiables. Il y a une erreur ? Contactez-nous : ${BHASILE_CONTACT_EMAIL}`}
        />
        <FieldSetDescription
          dnaCode={structure.dnaCode}
          formKind={FormKind.MODIFICATION}
        />
        <hr />
        <FieldSetContacts />
        <hr />
        <h2 className="text-xl font-bold mb-0 text-title-blue-france">
          Adresses
        </h2>
        <Notice
          severity="info"
          title=""
          description="L'ensemble des adresses sont des données sensibles qui sont protégées selon les normes du gouvernement. Elles ne seront communiquées qu'aux agents et agentes de DDETS."
        />
        <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        <hr />
        <FieldSetHebergement />
      </FormWrapper>
      {saveState === FetchState.ERROR && (
        <SubmitError
          structureDnaCode={structure.dnaCode}
          backendError={backendError}
        />
      )}
    </>
  );
}
