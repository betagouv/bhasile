import { useFormContext } from "react-hook-form";

import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "../../cpom/StructuresList";

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

  if (!structures) {
    return null;
  }

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Composition
      </legend>
      <StructuresList structures={structures} />
    </fieldset>
  );
};
