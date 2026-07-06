import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";

import { useOperateurContext } from "../_context/OperateurClientContext";

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
