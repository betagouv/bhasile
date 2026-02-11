"use client";

import { AutoSave } from "@/app/components/forms/AutoSave";
import UploadsByCategory from "@/app/components/forms/fieldsets/structure/FieldSetActeAdministratif";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { SubmitError } from "@/app/components/SubmitError";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import {
  getCategoriesDisplayRules,
  getCategoriesToDisplay,
} from "@/app/utils/categoryToDisplay.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  actesAdministratifsAutoriseesSchema,
  ActesAdministratifsAutoSaveFormValues,
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsSubventionneesSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Tabs } from "../_components/Tabs";

export default function FinalisationQualite() {
  const { structure } = useStructureContext();

  const currentStep = "05-documents";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const isAutorisee = isStructureAutorisee(structure.type);
  let schema;
  if (isAutorisee) {
    schema = actesAdministratifsAutoriseesSchema;
  } else {
    schema = actesAdministratifsSubventionneesSchema;
  }

  const categoriesToDisplay = getCategoriesToDisplay(structure).filter(
    (category) =>
      category !== "INSPECTION_CONTROLE" && category !== "EVALUATION"
  );

  const categoriesDisplayRules = getCategoriesDisplayRules(structure);

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({ currentStep });

  const defaultValues = getDefaultValues({
    structure,
  });

  const onAutoSave = async (data: ActesAdministratifsAutoSaveFormValues) => {
    const actesAdministratifs = data.actesAdministratifs?.filter(
      (acteAdministratif) => acteAdministratif.key
    );

    await handleAutoSave({
      actesAdministratifs,
      dnaCode: structure.dnaCode,
    });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={schema}
        onSubmit={handleValidation}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        defaultValues={defaultValues}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave
          schema={actesAdministratifsAutoSaveSchema}
          onSave={onAutoSave}
        />
        <InformationBar
          variant={
            currentFormStepStatus === StepStatus.VALIDE ? "success" : "complete"
          }
          title={
            currentFormStepStatus === StepStatus.VALIDE
              ? "Complété"
              : "À compléter"
          }
          description="Veuillez importer l’ensemble des actes administratifs historiques afférents à la structure, que les dates d’effets soient actuelles ou révolues."
        />

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
              {index < categoriesToDisplay.length - 1 && (
                <hr className="mt-13" />
              )}
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
    </div>
  );
}
