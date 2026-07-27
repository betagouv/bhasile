import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const TypePlaceLine = ({ line, years }: Props) => {
  const { control, watch } = useFormContext();

  const structureTypologies: StructureTypologieApiType[] = watch(
    "structureTypologies"
  );

  return (
    <tr>
      <td className="text-left! min-w-[280px]">
        <strong>{line.label}</strong>
        {line.subLabel && (
          <>
            <br />
            <span className="text-xs">{line.subLabel}</span>
          </>
        )}
      </td>
      {years.map((year) => {
        const currentStructureTypologyIndex = getMillesimeIndexForAYear(
          structureTypologies,
          year
        );

        return (
          <td key={year}>
            <InputWithValidation
              name={`structureTypologies.${currentStructureTypologyIndex}.${line.name}`}
              id={`structureTypologies.${currentStructureTypologyIndex}.${line.name}`}
              control={control}
              type="number"
              min={0}
              label=""
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
  line: { name: string; label: string; subLabel?: string };
  years: number[];
};
