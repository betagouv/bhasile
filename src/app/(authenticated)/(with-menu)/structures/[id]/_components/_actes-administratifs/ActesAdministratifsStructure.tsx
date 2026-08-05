import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { getCpomInheritedActes } from "@/app/utils/acteAdministratif.util";
import { useStructureContext } from "@/contexts/StructureClientContext";

export const ActesAdministratifsStructure = (): ReactElement => {
  const { structure } = useStructureContext();

  const { cpomLevel, typeScoped } = getCpomInheritedActes(structure);

  return (
    <ActesAdministratifsBlock
      structure={structure}
      actesAdministratifs={[
        ...(structure.actesAdministratifs ?? []),
        ...typeScoped,
      ]}
      editRoute={`/structures/${structure.id}/modification/actes-administratifs`}
      cpomActesAdministratifs={cpomLevel}
    />
  );
};
