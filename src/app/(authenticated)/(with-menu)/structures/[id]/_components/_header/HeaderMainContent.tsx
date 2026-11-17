import { ReactElement } from "react";

import { StructureHeaderContent } from "@/components/structures/StructureHeaderContent";
import { useStructureContext } from "@/contexts/StructureContext";

export const HeaderMainContent = (): ReactElement => {
  const { structure } = useStructureContext();

  const {
    codeBhasile,
    type,
    operateurLabel,
    nom,
    communeAdministrative,
    departementAdministratif,
  } = structure;

  return (
    <StructureHeaderContent
      title="Structure hébergement"
      codeBhasile={codeBhasile}
      nom={nom}
      type={type}
      operateurLabel={operateurLabel}
      communeAdministrative={communeAdministrative}
      departementAdministratif={departementAdministratif}
    />
  );
};
