import { useFormContext } from "react-hook-form";

import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { CpomDepartementApiType } from "@/schemas/api/cpom.schema";
import { FormKind } from "@/types/global";
import { StructureType } from "@/types/structure.type";

import { StructuresList } from "../../cpom/StructuresList";

export const FieldSetStructures = ({ formKind }: Props) => {
  const { watch } = useFormContext();

  const departements = watch("departements") as CpomDepartementApiType[];
  const operateur = watch("operateur");

  const dateStart = watch("dateStart");
  const dateEnd = watch("dateEnd");

  const { structures } = useStructuresSelection({
    // We only fetch the structures if dateStart and dateEnd are defined
    operateurName: dateStart && dateEnd ? operateur.name : undefined,
    departements: departements
      .map((departement) => departement.departement?.numero)
      .join(","),
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
      {formKind !== "modification" && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          Composition
        </legend>
      )}
      <StructuresList structures={structures} />
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
};
