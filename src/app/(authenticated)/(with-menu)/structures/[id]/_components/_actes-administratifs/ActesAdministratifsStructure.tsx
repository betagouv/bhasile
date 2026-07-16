import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsStructure = (): ReactElement => {
  const { structure } = useStructureContext();

  const cpomActesAdministratifs = structure.cpomStructures
    ?.flatMap((cpomStructure) => cpomStructure.cpom?.actesAdministratifs)
    .filter(
      (acte): acte is ActeAdministratifApiType =>
        !!acte && (!acte.structureType || acte.structureType === structure.type)
    );

  return (
    <ActesAdministratifsBlock
      structure={structure}
      actesAdministratifs={structure.actesAdministratifs}
      editRoute={`/structures/${structure.id}/modification/actes-administratifs`}
      cpomActesAdministratifs={cpomActesAdministratifs}
    />
  );
};
