import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { getOperateurActesAdministratifsCategoryToDisplay } from "@/config/acte-administratif.config";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const ActesAdministratifsOperateur = (): ReactElement => {
  const { operateur } = useOperateurContext();

  const categoriesRules = getOperateurActesAdministratifsCategoryToDisplay();

  return (
    <ActesAdministratifsBlock
      operateur={operateur}
      actesAdministratifs={operateur.actesAdministratifs}
      categoriesRules={categoriesRules}
      editRoute={`/operateurs/${operateur.id}/modification/actes-administratifs`}
    />
  );
};
