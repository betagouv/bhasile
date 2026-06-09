"use client";

import { useState } from "react";

import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useOperateurFormHandling } from "@/app/hooks/useOperateurFormHandling";
import { getOperateurDefaultValues } from "@/app/utils/operateur.util";
import { operateurUpdateSchema } from "@/schemas/forms/base/operateur.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useOperateurContext } from "../../_context/OperateurClientContext";

export default function OperateurModificationContacts() {
  const { operateur } = useOperateurContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("operateur-save");

  const { handleSubmit, backendError } = useOperateurFormHandling({
    operateurId: operateur.id,
    nextRoute: `/operateurs/${operateur.id}`,
  });

  const defaultValues = getOperateurDefaultValues(operateur);

  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  return (
    <>
      <ModificationTitle
        step="Contacts nationaux et territoriaux"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={operateurUpdateSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        handleCancel={() => setShouldOpenModal(true)}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetContacts displayPerimetre={true} />
        <hr />
        {saveState === FetchState.ERROR && (
          <SubmitError operateurId={operateur.id} backendError={backendError} />
        )}
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/operateurs/${operateur.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
