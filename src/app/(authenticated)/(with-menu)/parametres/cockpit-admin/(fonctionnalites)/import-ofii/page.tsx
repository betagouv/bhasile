import { ReactElement } from "react";

import { SpreadsheetImport } from "@/components/SpreadsheetImport";
import { MODELE_OFII_LINK } from "@/constants";

export default function CockpitAdminOfiiImport(): ReactElement {
  return (
    <SpreadsheetImport
      endpoint="/api/ofii-imports"
      label="Fichier OFII"
      intro="Téléversez ici le fichier fourni par l’OFII. Il doit respecter le format du fichier d’exemple ci-après : tant qu’il contient des erreurs, rien n’est chargé."
      exampleHref={MODELE_OFII_LINK}
      withMonth
    />
  );
}
