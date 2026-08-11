import { useFormContext } from "react-hook-form";

import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

import { TypePlaceCell } from "./TypePlaceCell";

export const TypePlaceLine = ({ line, years, messageId }: Props) => {
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
          <TypePlaceCell
            key={year}
            control={control}
            field={line.name}
            year={year}
            index={currentStructureTypologyIndex}
            messageId={messageId}
          />
        );
      })}
    </tr>
  );
};

type Props = {
  line: { name: string; label: string; subLabel?: string };
  years: number[];
  messageId: string;
};
