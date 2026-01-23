import { DateSelector } from "./DateSelector";
import { GranularitySelector } from "./GranularitySelector";
import { LocationSelector } from "./LocationSelector";

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
