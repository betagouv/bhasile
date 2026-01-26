import { DateSelector } from "../../cpom/DateSelector";
import { GranularitySelector } from "../../cpom/GranularitySelector";
import { LocationSelector } from "../../cpom/LocationSelector";

export const FieldSetGeneral = () => {
  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Adresse administrative
      </legend>
      <GranularitySelector />
      <LocationSelector />
      <DateSelector />
    </fieldset>
  );
};
