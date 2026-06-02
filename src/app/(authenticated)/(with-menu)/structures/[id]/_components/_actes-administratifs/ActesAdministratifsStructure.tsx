import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { getStructureActesAdministratifsCategoryToDisplay } from "@/config/structure.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsStructure = (): ReactElement => {
  const { structure } = useStructureContext();

  const cpomActesAdministratifs = structure.cpomStructures
    ?.flatMap((cpomStructure) => cpomStructure.cpom?.actesAdministratifs)
    .filter((acte): acte is ActeAdministratifApiType => !!acte);

  const categoriesRules =
    getStructureActesAdministratifsCategoryToDisplay(structure);

  return (
    <ActesAdministratifsBlock
      structure={structure}
      actesAdministratifs={structure.actesAdministratifs}
      categoriesRules={categoriesRules}
      editRoute={`/structures/${structure.id}/modification/actes-administratifs`}
      cpomActesAdministratifs={cpomActesAdministratifs}
    />
  );
};
