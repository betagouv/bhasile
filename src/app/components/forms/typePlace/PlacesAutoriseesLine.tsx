import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const PlacesAutoriseesLine = ({ years, isCapacityLocked }: Props) => {
  const { control, watch, setValue, getValues } = useFormContext();

  const structureTypologies: StructureTypologieApiType[] = watch(
    "structureTypologies"
  );

  const legacyIndex = getMillesimeIndexForAYear(
    structureTypologies,
    PLACES_VERSIONED_FROM_YEAR - 1
  );
  const legacyPlacesAutorisees =
    legacyIndex === -1
      ? undefined
      : structureTypologies[legacyIndex]?.placesAutorisees;

  useEffect(() => {
    if (isCapacityLocked || legacyIndex === -1) {
      return;
    }
    const currentTypologies: StructureTypologieApiType[] = getValues(
      "structureTypologies"
    );
    currentTypologies.forEach((typologie, index) => {
      if (typologie.year >= PLACES_VERSIONED_FROM_YEAR) {
        setValue(
          `structureTypologies.${index}.placesAutorisees`,
          legacyPlacesAutorisees ?? null
        );
      }
    });
  }, [
    isCapacityLocked,
    legacyIndex,
    legacyPlacesAutorisees,
    getValues,
    setValue,
  ]);

  return (
    <tr>
      <td className="text-left! min-w-[280px]">
        <strong>Places autorisées</strong>
      </td>
      {years.map((year) => {
        const currentStructureTypologyIndex = getMillesimeIndexForAYear(
          structureTypologies,
          year
        );

        return (
          <td key={year}>
            <InputWithValidation
              name={`structureTypologies.${currentStructureTypologyIndex}.placesAutorisees`}
              id={`structureTypologies.${currentStructureTypologyIndex}.placesAutorisees`}
              control={control}
              type="number"
              min={0}
              label=""
              disabled={year >= PLACES_VERSIONED_FROM_YEAR}
              className="mb-0 items-center [&_p]:hidden [&_input]:w-full w-24 mx-auto"
              variant="simple"
            />
          </td>
        );
      })}
    </tr>
  );
};

type Props = {
  years: number[];
  isCapacityLocked: boolean;
};
