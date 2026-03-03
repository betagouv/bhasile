"use client";

import { AutoSave } from "@/app/components/forms/AutoSave";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetNotes } from "@/app/components/forms/notes/FieldSetNotes";
import { NoteDisclaimer } from "@/app/components/forms/notes/NoteDisclaimer";
import { SubmitError } from "@/app/components/SubmitError";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import {
  NotesAutoSaveFormValues,
  notesAutoSaveSchema,
  notesSchema,
} from "@/schemas/forms/base/notes.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Tabs } from "../_components/Tabs";

export default function FinalisationNotes() {
  const { structure } = useStructureContext();

  const currentStep = "06-notes";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const defaultValues = getDefaultValues({ structure });

  const { handleValidation, handleAutoSave, backendError } =
    useAgentFormHandling({ currentStep });

  const onAutoSave = async (data: NotesAutoSaveFormValues) => {
    await handleAutoSave({ ...data, dnaCode: structure.dnaCode });
  };

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <div>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={notesSchema}
        onSubmit={handleValidation}
        defaultValues={defaultValues}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave schema={notesAutoSaveSchema} onSave={onAutoSave} />
        <InformationBar
          variant={
            currentFormStepStatus === StepStatus.VALIDE ? "success" : "complete"
          }
          title={
            currentFormStepStatus === StepStatus.VALIDE
              ? "Complété"
              : "À compléter"
          }
          description="Veuillez utiliser cet espace pour centraliser et annoter les informations nécessaires au pilotage de la structure : élément contextuel, prochaine échéance, document à produire, point d'attention, élément relationnel avec la structure..."
        />

        <NoteDisclaimer formKind={FormKind.FINALISATION} />

        <FieldSetNotes />
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
