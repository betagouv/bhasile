"use client";

import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { StructureAgentUpdateApiClient } from "@/schemas/api/structure.schema";
import {
  TypeBatiAndAdressesFormValues,
  typeBatiAndAdressesSchema,
} from "@/schemas/forms/base/adresse.schema";
import { FormKind } from "@/types/global";

export default function ModificationAdresses() {
  const { structure } = useStructureContext();

  const { handleSubmit } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({ structure });

  const onSubmit = (data: TypeBatiAndAdressesFormValues) => {
    handleSubmit({
      ...data,
      id: structure.id,
      adresses: data.adresses as StructureAgentUpdateApiClient["adresses"],
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
    </>
  );
}
