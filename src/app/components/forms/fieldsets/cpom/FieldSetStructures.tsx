import { useFormContext } from "react-hook-form";

import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "../../cpom/StructuresList";
import { StructuresTable } from "../../cpom/StructuresTable";

export const FieldSetStructures = () => {
  const { watch } = useFormContext();
  const departements = watch("departements");
  const operateur = watch("operateur");

  const { structures } = useStructuresSelection({
    operateurName: operateur.name,
    departements: departements?.join(","),
    types: [
      StructureType.HUDA,
      StructureType.CADA,
      StructureType.CPH,
      StructureType.CAES,
      StructureType.PRAHDA,
    ].join(","),
  });

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Composition
      </legend>
      <StructuresList structures={structures} />
      <StructuresTable structures={structures} />
    </fieldset>
  );
};
