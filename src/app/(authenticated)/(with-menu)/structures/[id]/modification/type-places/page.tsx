"use client";

import { useState } from "react";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { FieldSetTypePlaces } from "@/app/components/forms/typePlace/FieldSetTypePlaces";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { structureTypologiesSchema } from "@/schemas/forms/base/structureTypologie.schema";
import { FormKind } from "@/types/global";

export default function ModificationTypePlaces() {
  const { structure } = useStructureContext();

  const { handleSubmit } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({ structure });

  return (
    <>
      <ModificationTitle
        step="Types de places"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={structureTypologiesSchema}
        defaultValues={defaultValues}
        onSubmit={(data) =>
          handleSubmit({
            ...data,
            id: structure.id,
          })
        }
        mode="onChange"
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetTypePlaces
          structure={structure}
          formKind={FormKind.MODIFICATION}
        />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
