"use client";

import { AutoSave } from "@/app/components/forms/AutoSave";
import { Controles } from "@/app/components/forms/documents/Controles";
import { Evaluations } from "@/app/components/forms/evaluations/Evaluations";
import { FieldSetOuvertureFermeture } from "@/app/components/forms/fieldsets/structure/FieldSetOuvertureFermeture";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { SubmitError } from "@/app/components/SubmitError";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { transformFormControlesToApiControles } from "@/app/utils/controle.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { transformFormEvaluationsToApiEvaluations } from "@/app/utils/evaluation.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  FinalisationQualiteAutoSaveFormValues,
  finalisationQualiteAutoSaveSchema,
  finalisationQualiteSchema,
} from "@/schemas/forms/finalisation/finalisationQualite.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Tabs } from "../_components/Tabs";

export default function ModificationControleForm() {
  const { structure } = useStructureContext();

  const currentStep = "04-controles";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({
      currentStep,
    });

  const defaultValues = getDefaultValues({
    structure,
  });

  const onAutoSave = async (data: FinalisationQualiteAutoSaveFormValues) => {
    const controles = transformFormControlesToApiControles(data.controles);

    const evaluations = transformFormEvaluationsToApiEvaluations(
      data.evaluations
    );

    await handleAutoSave({
      ...data,
      controles,
      evaluations,
      dnaCode: structure.dnaCode,
    });
  };
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  // We check if one of the evaluations or controles has been updated (and now has an id).
  // If so, we need to update the form key to force a re-render of the form.
  // TODO: This is a hack to force a re-render of the form. We should find a better way to do this.
  const formKey = [
    ...(defaultValues.controles || []),
    ...(defaultValues.evaluations || []),
  ]
    .map((item) => item.id)
    .join("-");

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={finalisationQualiteSchema}
        onSubmit={handleValidation}
        submitButtonText="Je valide la saisie de cette page"
        resetRoute={`/structures/${structure.id}`}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        defaultValues={defaultValues}
        className="rounded-t-none"
        showAutoSaveMention
        key={formKey}
      >
        <AutoSave
          schema={finalisationQualiteAutoSaveSchema}
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
          description={
            isStructureAutorisee(structure.type)
              ? "Veuillez renseigner les informations et documents concernant l’ensemble des évaluations et inspections-contrôles auxquelles la structure a été soumise, et remplir les autres champs obligatoires ci-dessous."
              : "Veuillez renseigner les informations et documents concernant l’ensemble des inspections-contrôles auxquelles la structure a été soumise, et remplir les autres champs obligatoires ci-dessous."
          }
        />
        {isStructureAutorisee(structure.type) && (
          <>
            <Evaluations />
            <hr />
          </>
        )}
        <Controles />
        <hr />
        <FieldSetOuvertureFermeture formKind={FormKind.FINALISATION} />
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
