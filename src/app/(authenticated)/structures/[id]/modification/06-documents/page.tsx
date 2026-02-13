"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
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
import { ModificationTitle } from "../_components/ModificationTitle";

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
      dnaCode: structure.dnaCode,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        closeLink={`/structures/${structure.id}`}
      />
      <FormWrapper
        schema={schema}
        onSubmit={onSubmit}
        submitButtonText="Valider"
        resetRoute={`/structures/${structure.id}`}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        defaultValues={defaultValues}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <ActesAdministratifs />
        {saveState === FetchState.ERROR && (
          <SubmitError
            structureDnaCode={structure.dnaCode}
            backendError={backendError}
          />
        )}
      </FormWrapper>
    </>
  );
}
