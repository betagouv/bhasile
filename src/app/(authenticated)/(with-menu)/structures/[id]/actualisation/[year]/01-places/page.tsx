"use client";

import { useParams } from "next/navigation";
import { z } from "zod";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { AutoSave } from "@/app/components/forms/AutoSave";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetTypePlaces } from "@/app/components/forms/typePlace/FieldSetTypePlaces";
import { useActualisationFormHandling } from "@/app/hooks/useActualisationFormHandling";
import { getActualisationDefaultValues } from "@/app/utils/defaultValues.util";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import {
  structureTypologiesAutoSaveSchema,
  structureTypologiesSchema,
} from "@/schemas/forms/base/structureTypologie.schema";
import { FormKind } from "@/types/global";

import { ActualisationTabs } from "../_components/ActualisationTabs";

const currentStep = "01-places";

export default function ActualisationPlaces() {
  const { structure } = useStructureContext();
  const year = Number(useParams().year);

  const defaultValues = getActualisationDefaultValues({ structure });

  const { handleAutoSave, handleValidateStep } = useActualisationFormHandling({
    year,
    currentStep,
  });

  const onAutoSave = async (
    data: z.infer<typeof structureTypologiesAutoSaveSchema>
  ) => {
    await handleAutoSave(
      {
        structureTypologies:
          data.structureTypologies as StructureTypologieApiType[],
      },
      structureTypologiesSchema,
      data
    );
  };

  const onSubmit = async (data: z.infer<typeof structureTypologiesSchema>) => {
    await handleValidateStep({
      structureTypologies:
        data.structureTypologies as StructureTypologieApiType[],
    });
  };

  return (
    <div>
      <ActualisationTabs currentStep={currentStep} year={year} />
      <FormWrapper
        schema={structureTypologiesSchema}
        defaultValues={defaultValues}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
        onSubmit={onSubmit}
        className="rounded-t-none"
        showAutoSaveMention
      >
        <AutoSave
          schema={structureTypologiesAutoSaveSchema}
          onSave={onAutoSave}
        />
        <FieldSetTypePlaces
          structure={structure}
          formKind={FormKind.ACTUALISATION}
        />
      </FormWrapper>
    </div>
  );
}
