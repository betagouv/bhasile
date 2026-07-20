import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const YearlyTypePlace = ({ year, isCapacityLocked }: Props) => {
  const { control, register, watch, setValue } = useFormContext();

  const isPlacesAutoriseesReadOnly = year >= PLACES_VERSIONED_FROM_YEAR;

  const structureTypologies: StructureTypologieApiType[] = watch(
    "structureTypologies"
  );
  const currentStructureTypologyIndex = getMillesimeIndexForAYear(
    structureTypologies,
    year
  );
  const legacyIndex = getMillesimeIndexForAYear(
    structureTypologies,
    PLACES_VERSIONED_FROM_YEAR - 1
  );
  const legacyPlacesAutorisees =
    legacyIndex === -1
      ? undefined
      : structureTypologies[legacyIndex]?.placesAutorisees;

  const shouldMirrorLegacy =
    isPlacesAutoriseesReadOnly && !isCapacityLocked && legacyIndex !== -1;
  useEffect(() => {
    if (shouldMirrorLegacy && currentStructureTypologyIndex !== -1) {
      setValue(
        `structureTypologies.${currentStructureTypologyIndex}.placesAutorisees`,
        legacyPlacesAutorisees ?? null
      );
    }
  }, [
    shouldMirrorLegacy,
    legacyPlacesAutorisees,
    currentStructureTypologyIndex,
    setValue,
  ]);

  if (currentStructureTypologyIndex === -1) {
    return null;
  }

  return (
    <tr className="w-full [&_input]:max-w-16 border-t border-default-grey ">
      <td className="hidden">
        <InputWithValidation
          name={`structureTypologies.${currentStructureTypologyIndex}.id`}
          id={`structureTypologies.${currentStructureTypologyIndex}.id`}
          control={control}
          type="hidden"
          label="id"
        />
      </td>
      <td className="align-middle py-4">{year}</td>
      <td className="py-4!">
        <InputWithValidation
          name={`structureTypologies.${currentStructureTypologyIndex}.placesAutorisees`}
          id={`structureTypologies.${currentStructureTypologyIndex}.placesAutorisees`}
          control={control}
          type="number"
          min={0}
          label=""
          disabled={isPlacesAutoriseesReadOnly}
          className="mb-0 mx-auto items-center [&_p]:hidden"
          variant="simple"
        />
      </td>
      <td className="py-1!">
        <InputWithValidation
          name={`structureTypologies.${currentStructureTypologyIndex}.pmr`}
          id={`structureTypologies.${currentStructureTypologyIndex}.pmr`}
          control={control}
          type="number"
          min={0}
          label=""
          className="mb-0 mx-auto items-center [&_p]:hidden"
          variant="simple"
        />
      </td>
      <td className="py-1!">
        <InputWithValidation
          name={`structureTypologies.${currentStructureTypologyIndex}.lgbt`}
          id={`structureTypologies.${currentStructureTypologyIndex}.lgbt`}
          control={control}
          type="number"
          min={0}
          label=""
          className="mb-0 mx-auto items-center [&_p]:hidden"
          variant="simple"
        />
      </td>
      <td className="py-1!">
        <InputWithValidation
          name={`structureTypologies.${currentStructureTypologyIndex}.fvvTeh`}
          id={`structureTypologies.${currentStructureTypologyIndex}.fvvTeh`}
          control={control}
          type="number"
          min={0}
          label=""
          className="mb-0 mx-auto items-center [&_p]:hidden"
          variant="simple"
        />
        <input
          aria-hidden="true"
          defaultValue={year}
          type="hidden"
          {...register(
            `structureTypologies.${currentStructureTypologyIndex}.year`
          )}
        />
      </td>
    </tr>
  );
};

type Props = {
  year: number;
  isCapacityLocked: boolean;
};
