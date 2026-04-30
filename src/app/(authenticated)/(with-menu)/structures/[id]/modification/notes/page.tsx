"use client";
import { ReactElement, useState } from "react";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { FieldSetNotes } from "@/app/components/forms/notes/FieldSetNotes";
import { NoteDisclaimer } from "@/app/components/forms/notes/NoteDisclaimer";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { notesSchema } from "@/schemas/forms/base/notes.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

import { useStructureContext } from "../../_context/StructureClientContext";

export default function ModificationNotesForm(): ReactElement {
  const { structure } = useStructureContext();

  const defaultValues = getDefaultValues({ structure });

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <>
      <ModificationTitle
        step="Notes"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={notesSchema}
        onSubmit={(data) =>
          handleSubmit({
            ...data,
            id: structure.id,
          })
        }
        defaultValues={defaultValues}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-[2px] border-solid border-[var(--text-title-blue-france)]"
      >
        <NoteDisclaimer formKind={FormKind.MODIFICATION} />
        <FieldSetNotes />
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
