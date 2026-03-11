import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import { useEffect, useRef, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { FormKind } from "@/types/global";
import { PublicType, StructureType } from "@/types/structure.type";

import InputWithValidation from "../../InputWithValidation";
import { OperateurAutocomplete } from "../../OperateurAutocomplete";
import SelectWithValidation from "../../SelectWithValidation";

export const FieldSetDescription = ({
  dnaCode,
  disableTypes = true,
  formKind = FormKind.FINALISATION,
}: Props) => {
  const filialesContainerRef = useRef(null);
  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { register, control, setValue, watch } = parentFormContext || localForm;
  const [isManagedByAFiliale, setIsManagedByAFiliale] = useState(false);
  const [type, setType] = useState<string | undefined>(
    parentFormContext ? watch("type") : undefined
  );

  useEffect(() => {
    if (filialesContainerRef.current) {
      autoAnimate(filialesContainerRef.current);
    }
  }, [filialesContainerRef]);

  useEffect(() => {
    if (parentFormContext) {
      const subscription = parentFormContext.watch((value, { name }) => {
        if (name === "type") {
          setType(value.type);
        }
      });
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, [parentFormContext]);

  const filiale = watch("filiale");

  useEffect(() => {
    setIsManagedByAFiliale(!!filiale);
  }, [filiale]);

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-10 text-title-blue-france">
        {formKind === FormKind.MODIFICATION ? "Général" : "Description"}
      </legend>

      <input
        type="hidden"
        id="dnaCode"
        {...register("dnaCode")}
        defaultValue={dnaCode}
      />
      {formKind !== FormKind.MODIFICATION && (
        <>
          <div className="flex">
            <ToggleSwitch
              label="Cette structure appartient-elle à une filiale d’opérateur (ex: YSOS, filiale de SOS) ?"
              labelPosition="left"
              showCheckedHint={false}
              className="w-fit [&_label]:gap-2"
              checked={isManagedByAFiliale}
              name="managed-by-a-filiale"
              id="managed-by-a-filiale"
              onChange={() => {
                setIsManagedByAFiliale(!isManagedByAFiliale);
                setValue("filiale", "", { shouldValidate: true });
              }}
            />
            <p className="pl-2">{isManagedByAFiliale ? "Oui" : "Non"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectWithValidation
              name="type"
              control={control}
              label="Type"
              disabled={disableTypes}
              required
              onChange={setType}
              id="type"
            >
              <option value="">Sélectionnez un type</option>
              {Object.values(StructureType)
                .filter(
                  (structureType) => structureType !== StructureType.PRAHDA
                )
                .map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </SelectWithValidation>

            <OperateurAutocomplete />

            <div ref={filialesContainerRef}>
              {isManagedByAFiliale && (
                <InputWithValidation
                  name="filiale"
                  control={control}
                  type="text"
                  label="Filiale"
                  id="filiale"
                />
              )}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formKind !== FormKind.MODIFICATION && (
          <InputWithValidation
            name="creationDate"
            control={control}
            type="date"
            label="Date de création de la structure"
            id="creationDate"
          />
        )}
        {isStructureAutorisee(type) && formKind !== FormKind.MODIFICATION && (
          <InputWithValidation
            name="finessCode"
            control={control}
            type="text"
            label="Code FINESS"
            id="finessCode"
          />
        )}
        <SelectWithValidation
          name="public"
          control={control}
          label="Public"
          id="public"
        >
          <option value="">Sélectionnez une option</option>
          {Object.values(PublicType).map((publicType) => (
            <option key={publicType} value={publicType}>
              {publicType}
            </option>
          ))}
        </SelectWithValidation>
      </div>
      <CustomNotice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center"
        description="LGBT : Lesbiennes, Gays, Bisexuels et Transgenres – FVV : Femmes Victimes de Violences–TEH : Traîte des Êtres Humains"
      />
      <label className="flex gap-6">
        Actuellement, la structure dispose-t-elle de places labellisées /
        spécialisées ?
        <Checkbox
          options={[
            {
              label: "LGBT",
              nativeInputProps: {
                ...register("lgbt"),
              },
            },
          ]}
        />
        <Checkbox
          options={[
            {
              label: "FVV et TEH",
              nativeInputProps: {
                ...register("fvvTeh"),
              },
            },
          ]}
        />
      </label>
    </fieldset>
  );
};

type Props = {
  dnaCode: string;
  disableTypes?: boolean;
  formKind?: FormKind;
};
