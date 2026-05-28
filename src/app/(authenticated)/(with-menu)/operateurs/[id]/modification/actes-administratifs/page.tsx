"use client";

import { useState } from "react";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useOperateurFormHandling } from "@/app/hooks/useOperateurFormHandling";
import { getOperateurDefaultValues } from "@/app/utils/operateur.util";
import { getOperateurActesAdministratifsCategoryToDisplay } from "@/config/acte-administratif.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  ActesAdministratifsFormValues,
  actesAdministratifsOperateurSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useOperateurContext } from "../../_context/OperateurClientContext";

export default function OperateurModificationActesAdministratifs() {
  const { operateur } = useOperateurContext();

  const { handleSubmit, backendError } = useOperateurFormHandling({
    operateurId: operateur.id,
    nextRoute: `/operateurs/${operateur.id}`,
  });

  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getOperateurDefaultValues(operateur);

  const onSubmit = async (data: ActesAdministratifsFormValues) => {
    const actesAdministratifs = (data.actesAdministratifs ?? []).filter(
      (acte) =>
        acte.fileUploads?.length && acte.category && acte.fileUploads[0].key
    ) as ActeAdministratifApiType[];

    await handleSubmit({
      id: operateur.id,
      actesAdministratifs,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("operateur-save");

  const key = operateur.actesAdministratifs
    ?.map((acteAdministratif) => acteAdministratif.id ?? acteAdministratif.uuid)
    ?.join(",");

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={actesAdministratifsOperateurSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
        key={key}
      >
        <ActesAdministratifs
          categoryDisplayRules={getOperateurActesAdministratifsCategoryToDisplay()}
        />
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
