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
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  actesAdministratifsAutoriseesSchema,
  ActesAdministratifsFormValues,
  actesAdministratifsSubventionneesSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useStructureContext } from "../../_context/StructureClientContext";

export default function ModificationQualiteForm() {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure.type);
  let schema;
  if (isAutorisee) {
    schema = actesAdministratifsAutoriseesSchema;
  } else {
    schema = actesAdministratifsSubventionneesSchema;
  }

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({
    structure,
  });

  const onSubmit = async (data: ActesAdministratifsFormValues) => {
    const actesAdministratifs = (data.actesAdministratifs ?? []).filter(
      (acteAdministratif) =>
        acteAdministratif.fileUploads?.length &&
        acteAdministratif.category &&
        acteAdministratif.fileUploads[0].key
    ) as ActeAdministratifApiType[];

    await handleSubmit({
      actesAdministratifs,
      id: structure.id,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  const key = structure?.actesAdministratifs
    ?.map((acteAdministratif) => acteAdministratif.id ?? acteAdministratif.uuid)
    ?.join(",");

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={schema}
        onSubmit={onSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.SUBMIT,
          FooterButtonType.CANCEL,
        ]}
        defaultValues={defaultValues}
        className="border-2 border-solid border-(--text-title-blue-france)"
        key={key}
      >
        <ActesAdministratifs />
        {saveState === FetchState.ERROR && (
          <SubmitError
            codeBhasile={structure.codeBhasile}
            backendError={backendError}
          />
        )}
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
