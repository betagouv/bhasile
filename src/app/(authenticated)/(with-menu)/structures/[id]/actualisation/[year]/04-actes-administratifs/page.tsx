"use client";

import { useParams } from "next/navigation";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import { AutoSave } from "@/app/components/forms/AutoSave";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { useActualisationFormHandling } from "@/app/hooks/useActualisationFormHandling";
import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import { getActualisationActesAdministratifsCategoryToDisplay } from "@/config/structure.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  actesAdministratifsAutoriseesSchema,
  ActesAdministratifsAutoSaveFormValues,
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsSubventionneesSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";

import { ActualisationTabs } from "../_components/ActualisationTabs";

const currentStep = "04-actes-administratifs";

export default function ActualisationActesAdministratifs() {
  const { structure } = useStructureContext();
  const year = Number(useParams().year);

  const defaultValues = getActualisationDefaultValues({ structure });

  const strictSchema = structure.isAutorisee
    ? actesAdministratifsAutoriseesSchema
    : actesAdministratifsSubventionneesSchema;

  const { handleAutoSave, handleValidateStep } = useActualisationFormHandling({
    year,
    currentStep,
  });

  const toActesAdministratifs = (
    data: ActesAdministratifsAutoSaveFormValues
  ): ActeAdministratifApiType[] =>
    data.actesAdministratifs?.filter(
      (acteAdministratif) => acteAdministratif.category
    ) as ActeAdministratifApiType[];

  const onAutoSave = async (data: ActesAdministratifsAutoSaveFormValues) => {
    await handleAutoSave(
      { actesAdministratifs: toActesAdministratifs(data) },
      strictSchema,
      data
    );
  };

  const onSubmit = async (data: ActesAdministratifsAutoSaveFormValues) => {
    await handleValidateStep({
      actesAdministratifs: toActesAdministratifs(data),
    });
  };

  const categoriesRules =
    getActualisationActesAdministratifsCategoryToDisplay(structure);

  const key = structure?.actesAdministratifs
    ?.map((acteAdministratif) => acteAdministratif.id ?? acteAdministratif.uuid)
    ?.sort((first, second) =>
      `${first ?? ""}`.localeCompare(`${second ?? ""}`)
    )
    ?.join(",");

  return (
    <div>
      <ActualisationTabs currentStep={currentStep} year={year} />
      <FormWrapper
        schema={strictSchema}
        defaultValues={defaultValues}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={onSubmit}
        className="rounded-t-none"
        showAutoSaveMention
        key={key}
      >
        <AutoSave
          schema={actesAdministratifsAutoSaveSchema}
          onSave={onAutoSave}
        />
        <ActesAdministratifs categoryDisplayRules={categoriesRules} />
      </FormWrapper>
    </div>
  );
}
