import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsBlock";
import { operateurActesAdministratifsCategoryToDisplay } from "@/config/operateur.config";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const ActesAdministratifsOperateur = (): ReactElement => {
  const { operateur } = useOperateurContext();

  const categoriesRules = operateurActesAdministratifsCategoryToDisplay;

  return (
    <ActesAdministratifsBlock
      operateur={operateur}
      actesAdministratifs={operateur.actesAdministratifs}
      categoriesRules={categoriesRules}
      editRoute={`/operateurs/${operateur.id}/modification/actes-administratifs`}
      title="Documents"
    />
  );
};
