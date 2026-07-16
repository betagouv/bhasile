"use client";

import { useState } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { FieldSetGeneral } from "@/app/components/forms/cpom/FieldSetGeneral";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { descriptionCpomSchema } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationDescription() {
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
        step="Description"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={descriptionCpomSchema}
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
        <CustomNotice
          severity="info"
          description="Les dates de début et de fin du CPOM se modifient dans le bloc “Document de convention du CPOM”."
        />
        <FieldSetGeneral />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/cpoms/${cpom.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
