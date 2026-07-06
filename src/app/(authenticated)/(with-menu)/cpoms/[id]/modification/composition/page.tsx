"use client";

import { useState } from "react";

import { FieldSetStructures } from "@/app/components/forms/cpom/FieldSetStructures";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { compositionCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FormKind } from "@/types/global";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationComposition() {
  const { cpom } = useCpomContext();

  const { handleSubmit } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getCpomDefaultValues(cpom);

  return (
    <>
      <ModificationTitle
        step="Composition"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={compositionCpomSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france)"
      >
        <FieldSetStructures formKind={FormKind.MODIFICATION} />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/cpoms/${cpom.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
