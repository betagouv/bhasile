import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { CURRENT_YEAR } from "@/constants";

export const FieldSetCurrentYearPlaces = () => {
  const { control, register } = useFormContext();

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Types de place (tels que prévus dans la convention)
      </legend>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="structureTypologies.0.placesAutorisees"
          id="structureTypologies.0.placesAutorisees"
          control={control}
          type="number"
          min={0}
          label="Nombre total de places autorisées"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="structureTypologies.0.pmr"
          id="structureTypologies.0.pmr"
          control={control}
          type="number"
          min={0}
          label="Nombre de places PMR*"
          hintText="*Personnes à Mobilité Réduite"
        />
        <InputWithValidation
          name="structureTypologies.0.lgbt"
          id="structureTypologies.0.lgbt"
          control={control}
          type="number"
          min={0}
          label="Nombre de places LGBT* (labellisées)"
          hintText="*Lesbiennes, Gays, Bisexuels et Transgenres"
        />
        <InputWithValidation
          name="structureTypologies.0.fvvTeh"
          id="structureTypologies.0.fvvTeh"
          control={control}
          type="number"
          min={0}
          label="Nombre de places FVV/TEH* (spécialisées)"
          hintText="*Femmes Victimes de Violences/Traîte des Êtres Humains"
        />
      </div>

      <input
        aria-hidden="true"
        defaultValue={CURRENT_YEAR}
        type="hidden"
        {...register("structureTypologies.0.year")}
      />
    </fieldset>
  );
};
