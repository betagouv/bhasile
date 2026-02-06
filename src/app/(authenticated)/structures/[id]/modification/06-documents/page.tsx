"use client";

import UploadsByCategory from "@/app/components/forms/documents/UploadsByCategory";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import {
  getCategoriesDisplayRules,
  getCategoriesToDisplay,
} from "@/app/utils/categoryToDisplay.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  actesAdministratifsAutoriseesSchema,
  ActesAdministratifsFormValues,
  actesAdministratifsSubventionneesSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ModificationTitle } from "../components/ModificationTitle";

export default function ModificationQualiteForm() {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure.type);
  let schema;
  if (isAutorisee) {
    schema = actesAdministratifsAutoriseesSchema;
  } else {
    schema = actesAdministratifsSubventionneesSchema;
  }

  const categoriesToDisplay = getCategoriesToDisplay(structure).filter(
    (category) =>
      category !== "INSPECTION_CONTROLE" &&
      category !== "EVALUATION" &&
      category !== "CPOM"
  );

  const categoriesDisplayRules = getCategoriesDisplayRules(structure);

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const defaultValues = getDefaultValues({
    structure,
  });

  const onSubmit = async (data: ActesAdministratifsFormValues) => {
    const actesAdministratifs = data.actesAdministratifs?.filter(
      (acteAdministratif) => acteAdministratif.key
    );

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
        <MaxSizeNotice />

        {categoriesToDisplay.map((category, index) => {
          return (
            <div key={category}>
              <UploadsByCategory
                category={category}
                categoryShortName={
                  categoriesDisplayRules[category].categoryShortName
                }
                title={categoriesDisplayRules[category].title}
                canAddFile={categoriesDisplayRules[category].canAddFile}
                canAddAvenant={categoriesDisplayRules[category].canAddAvenant}
                isOptional={categoriesDisplayRules[category].isOptional}
                additionalFieldsType={
                  categoriesDisplayRules[category].additionalFieldsType
                }
                documentLabel={categoriesDisplayRules[category].documentLabel}
                addFileButtonLabel={
                  categoriesDisplayRules[category].addFileButtonLabel
                }
                notice={categoriesDisplayRules[category].notice}
              />
              {index < categoriesToDisplay.length - 1 && <hr />}
            </div>
          );
        })}
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
