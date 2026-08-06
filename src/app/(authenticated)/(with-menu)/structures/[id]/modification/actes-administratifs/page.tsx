"use client";

import { useState } from "react";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import {
  getCpomCoveredActeCategories,
  relaxCoveredCategories,
} from "@/app/utils/acteAdministratif.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getStructureActesAdministratifsCategoryToDisplay } from "@/config/structure.config";
import { useStructureContext } from "@/contexts/StructureContext";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActesAdministratifsFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { getActesAdministratifsSchema } from "@/schemas/forms/base/acteAdministratif/getActesAdministratifsSchema";

export default function ModificationQualiteForm() {
  const { structure } = useStructureContext();

  const schema = getActesAdministratifsSchema(structure);

  const { handleSubmit } = useAgentFormHandling({
    nextRoute: `/structures/${structure.id}`,
  });

  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getDefaultValues({
    structure,
  });

  const onSubmit = async (data: ActesAdministratifsFormValues) => {
    const actesAdministratifs = (data.actesAdministratifs ?? []).filter(
      (acteAdministratif) =>
        acteAdministratif.fileUploads?.length &&
        acteAdministratif.category &&
        acteAdministratif.fileUploads[0].key
    ) as ActeAdministratifApiType[];

    await handleSubmit({
      actesAdministratifs,
      id: structure.id,
    });
  };

  const key = structure?.actesAdministratifs
    ?.map((acteAdministratif) => acteAdministratif.id ?? acteAdministratif.uuid)
    ?.join(",");

  const categoriesRules = relaxCoveredCategories(
    getStructureActesAdministratifsCategoryToDisplay(structure),
    getCpomCoveredActeCategories(structure)
  );

  return (
    <>
      <ModificationTitle
        step="Actes administratifs"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={schema}
        onSubmit={onSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.SUBMIT,
          FooterButtonType.CANCEL,
        ]}
        defaultValues={defaultValues}
        className="border-2 border-solid border-(--text-title-blue-france)"
        key={key}
      >
        <ActesAdministratifs categoryDisplayRules={categoriesRules} />
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/structures/${structure.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
