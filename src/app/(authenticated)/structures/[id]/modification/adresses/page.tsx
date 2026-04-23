"use client";

import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { transformFormAdressesToApiAdresses } from "@/app/utils/adresse.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import {
  TypeBatiAndAdressesFormValues,
  typeBatiAndAdressesSchema,
} from "@/schemas/forms/base/adresse.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

export default function ModificationAdresses() {
  const { structure } = useStructureContext();

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({ structure });

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  const onSubmit = (data: TypeBatiAndAdressesFormValues) => {
    handleSubmit({
      ...data,
      id: structure.id,
      adresses: transformFormAdressesToApiAdresses(data.adresses, structure.id),
    });
  };
  return (
    <>
      <ModificationTitle
        step="Adresses d’hébergement"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={typeBatiAndAdressesSchema}
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
        <FieldSetTypeBati />
        <FieldSetHebergement formKind={FormKind.MODIFICATION} />
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
