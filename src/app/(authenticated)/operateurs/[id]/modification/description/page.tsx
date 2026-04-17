"use client";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { FieldSetDescription } from "@/app/components/forms/operateur/FieldSetDescription";
import { FieldSetDirectionGenerale } from "@/app/components/forms/operateur/FieldSetDirectionGenerale";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useOperateurFormHandling } from "@/app/hooks/useOperateurFormHandling";
import { getOperateurDefaultValues } from "@/app/utils/operateur.util";
import { operateurUpdateSchema } from "@/schemas/forms/base/operateur.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useOperateurContext } from "../../_context/OperateurClientContext";

export default function OperateurModificationDescription() {
  const { operateur } = useOperateurContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("operateur-save");

  const { handleSubmit, backendError } = useOperateurFormHandling({
    operateurId: operateur.id,
    nextRoute: `/operateurs/${operateur.id}`,
  });

  const defaultValues = getOperateurDefaultValues(operateur);

  return (
    <>
      <ModificationTitle
        step="Description"
        closeLink={`/operateurs/${operateur.id}`}
      />{" "}
      <FormWrapper
        schema={operateurUpdateSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        resetRoute={`/operateurs/${operateur.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetDescription />
        <hr />
        <FieldSetDirectionGenerale />
        {saveState === FetchState.ERROR && (
          <SubmitError operateurId={operateur.id} backendError={backendError} />
        )}
      </FormWrapper>
    </>
  );
}
