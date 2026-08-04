"use client";

import { ActesAdministratifs } from "@/app/components/forms/actesAdministratifs/ActesAdministratifs";
import { AutoSave } from "@/app/components/forms/AutoSave";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { InformationBar } from "@/app/components/ui/InformationBar";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import {
  getCpomCoveredActeCategories,
  relaxCoveredCategories,
} from "@/app/utils/acteAdministratif.util";
import { getDefaultValues } from "@/app/utils/defaultValues.util";
import { getFinalisationFormStepStatus } from "@/app/utils/finalisationForm.util";
import { getStructureActesAdministratifsCategoryToDisplay } from "@/config/structure.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import {
  ActesAdministratifsAutoSaveFormValues,
  actesAdministratifsAutoSaveSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { getActesAdministratifsSchema } from "@/schemas/forms/base/acteAdministratif/getActesAdministratifsSchema";
import { StepStatus } from "@/types/form.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Tabs } from "../_components/Tabs";

export default function FinalisationQualite() {
  const { structure } = useStructureContext();

  const currentStep = "05-documents";

  const currentFormStepStatus = getFinalisationFormStepStatus(
    currentStep,
    structure
  );

  const schema = getActesAdministratifsSchema(structure);

  const { handleValidation, handleAutoSave } = useAgentFormHandling({
    currentStep,
  });

  const defaultValues = getDefaultValues({
    structure,
  });

  const onAutoSave = async (data: ActesAdministratifsAutoSaveFormValues) => {
    const actesAdministratifs = data.actesAdministratifs?.filter(
      (acteAdministratif) => acteAdministratif.category
    ) as ActeAdministratifApiType[];

    await handleAutoSave({
      actesAdministratifs,
      id: structure.id,
    });
  };

  const key = structure?.actesAdministratifs
    ?.map((acteAdministratif) => acteAdministratif.id ?? acteAdministratif.uuid)
    ?.sort((a, b) => `${a ?? ""}`.localeCompare(`${b ?? ""}`))
    ?.join(",");

  const categoriesRules = relaxCoveredCategories(
    getStructureActesAdministratifsCategoryToDisplay(structure),
    getCpomCoveredActeCategories(structure)
  );

  return (
    <>
      <Tabs currentStep={currentStep} />
      <FormWrapper
        schema={schema}
        onSubmit={handleValidation}
        submitButtonText="Je valide la saisie de cette page"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        defaultValues={defaultValues}
        className="rounded-t-none"
        showAutoSaveMention
        key={key}
      >
        <AutoSave
          schema={actesAdministratifsAutoSaveSchema}
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
          description="Veuillez importer l’ensemble des actes administratifs historiques afférents à la structure, que les dates d’effets soient actuelles ou révolues."
        />

        <ActesAdministratifs categoryDisplayRules={categoriesRules} />
      </FormWrapper>
    </>
  );
}
