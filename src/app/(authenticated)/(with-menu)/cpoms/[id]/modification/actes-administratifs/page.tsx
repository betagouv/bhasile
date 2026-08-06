"use client";

import { useState } from "react";

import { FieldSetActesAdministratifs } from "@/app/components/forms/cpom/FieldSetActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import {
  CPOM_ACTE_SCOPE,
  CpomActeScope,
  getCpomActesScopes,
  getCpomDefaultValues,
} from "@/app/utils/cpom.util";
import { useCpomContext } from "@/contexts/CpomContext";
import { actesAdministratifsCpomSchema } from "@/schemas/forms/base/cpom.schema";

import { ActesScopeSwitch } from "../../_components/ActesScopeSwitch";

export default function CpomModificationActesAdministratifs() {
  const { cpom } = useCpomContext();

  const { handleSubmit } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const [currentScope, setCurrentScope] =
    useState<CpomActeScope>(CPOM_ACTE_SCOPE);

  const defaultValues = getCpomDefaultValues(cpom);
  const scopes = getCpomActesScopes(cpom);

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        titleAside={
          scopes.length > 1 ? (
            <ActesScopeSwitch
              scopes={scopes}
              currentScope={currentScope}
              handleChange={setCurrentScope}
            />
          ) : undefined
        }
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={actesAdministratifsCpomSchema}
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
        <FieldSetActesAdministratifs currentScope={currentScope} />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/cpoms/${cpom.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
