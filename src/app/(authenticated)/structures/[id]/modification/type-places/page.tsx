"use client";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetOuvertureFermeture } from "@/app/components/forms/ouvertureFermeture/FieldSetOuvertureFermeture";
import { FieldSetTypePlaces } from "@/app/components/forms/typePlace/FieldSetTypePlaces";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { structureTypologiesWithMandatoryEvolutionSchema } from "@/schemas/forms/base/structureTypologie.schema";
import { FetchState } from "@/types/fetch-state.type";
import { FormKind } from "@/types/global";

export default function ModificationTypePlaces() {
  const { structure } = useStructureContext();

  const { handleSubmit, backendError } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const defaultValues = getDefaultValues({ structure });

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <>
      <ModificationTitle
        step="Types de places"
        closeLink={`/structures/${structure.id}`}
      />
      <FormWrapper
        schema={structureTypologiesWithMandatoryEvolutionSchema}
        defaultValues={defaultValues}
        onSubmit={(data) =>
          handleSubmit({
            ...data,
            id: structure.id,
          })
        }
        mode="onChange"
        resetRoute={`/structures/${structure.id}`}
        submitButtonText="Valider"
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetOuvertureFermeture formKind={FormKind.MODIFICATION} />
        <FieldSetTypePlaces
          structure={structure}
          formKind={FormKind.MODIFICATION}
        />
      </FormWrapper>
      {saveState === FetchState.ERROR && (
        <SubmitError
          codeBhasile={structure.codeBhasile}
          backendError={backendError}
        />
      )}
    </>
  );
}
