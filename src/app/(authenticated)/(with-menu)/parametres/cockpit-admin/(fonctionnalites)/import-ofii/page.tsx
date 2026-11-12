import { ReactElement } from "react";

import { SpreadsheetImport } from "@/components/SpreadsheetImport";
import { MODELE_OFII_LINK } from "@/constants";

export default function CockpitAdminOfiiImport(): ReactElement {
  return (
    <SpreadsheetImport
      endpoint="/api/ofii-imports"
      label="Fichier OFII"
      exampleHref={MODELE_OFII_LINK}
    />
  );
}
