import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { useOperateurContext } from "@/contexts/OperateurContext";

export const ActesAdministratifsOperateur = (): ReactElement => {
  const { operateur } = useOperateurContext();

  return (
    <ActesAdministratifsBlock
      operateur={operateur}
      actesAdministratifs={operateur.actesAdministratifs}
      editRoute={`/operateurs/${operateur.id}/modification/actes-administratifs`}
      title="Documents"
    />
  );
};
