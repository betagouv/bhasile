import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { EntityId } from "@/types/Entity.type";
import { FormKind } from "@/types/global";

import { DnaInput } from "../adresseAdministrativeAndAntenne/DnaInput";
import InputWithValidation from "../InputWithValidation";
import { FieldSetDna } from "./FieldSetDna";
import { FieldSetFiness } from "./FieldSetFiness";

export const DnaAndFiness = ({
  formKind = FormKind.FINALISATION,
  entityId,
}: Props) => {
  const { watch, control, setValue } = useFormContext();

  const isMultiDna = watch("isMultiDna");

  const type = watch("type");

  const isAutorisee = isStructureAutorisee(type);
  const isSubventionnee = isStructureSubventionnee(type);

  let checkboxLabel = `La structure dispose de plusieurs codes DNA${isAutorisee ? " et/ou FINESS" : ""}.`;
  if (isSubventionnee && formKind === FormKind.MODIFICATION) {
    checkboxLabel = "La structure dispose de plusieurs codes FINESS";
  }

  useEffect(() => {
    if (!isMultiDna) {
      const dnaStructures = watch("dnaStructures");
      const finesses = watch("finesses");

      if (dnaStructures && dnaStructures[0]) {
        setValue("dnaStructures", [dnaStructures?.[0]]);
      }

      if (finesses && finesses[0]) {
        setValue("finesses", [finesses?.[0]]);
      }
    }
  }, [isMultiDna, setValue, watch]);

  // We had a bug that set finess to [null], so we have to clean it up
  // TODO: to delete once the ajout form is dead
  const finesses = watch("finesses");
  useEffect(() => {
    if (finesses && finesses[0] === null) {
      setValue("finesses", undefined);
    }
  }, [finesses, setValue]);

  const title = `Code${isMultiDna ? "s" : ""} DNA${isAutorisee ? " et FINESS" : ""}`;

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france max-w-3xl">
        {title}
      </h2>
      {!isAutorisee || formKind !== FormKind.MODIFICATION ? (
        <Checkbox
          options={[
            {
              label: checkboxLabel,
              nativeInputProps: {
                name: "isMultiDna",
                checked: isMultiDna,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("isMultiDna", e.target.checked);
                },
              },
            },
          ]}
        />
      ) : null}
      {isMultiDna ? (
        <>
          <FieldSetDna formKind={formKind} entityId={entityId} />
          {isAutorisee && <FieldSetFiness />}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1">
          <DnaInput
            index={0}
            label="Code DNA"
            disabled={formKind === FormKind.MODIFICATION}
            entityId={entityId}
          />
          {isAutorisee && (
            <InputWithValidation
              name="finesses.0.code"
              id="finesses.0.code"
              control={control}
              type="text"
              label="Code FINESS"
            />
          )}
        </div>
      )}
    </>
  );
};

type Props = {
  formKind?: FormKind;
  entityId?: EntityId;
};
