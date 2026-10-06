import { useFormContext } from "react-hook-form";

import { useStructuresSelection } from "@/app/hooks/useStructuresSelection";
import { CpomApiRead, CpomDepartementApiType } from "@/schemas/api/cpom.schema";
import { FormKind } from "@/types/global";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

import { StructuresList } from "./StructuresList";

export const FieldSetStructures = ({
  formKind,
  cpomStructures,
}: Props) => {
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
    types: ACCEPTED_STRUCTURE_TYPES.join(","),
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
      <StructuresList
        structures={structures}
        cpomStructures={cpomStructures}
      />
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
  cpomStructures?: CpomApiRead["structures"];
};
