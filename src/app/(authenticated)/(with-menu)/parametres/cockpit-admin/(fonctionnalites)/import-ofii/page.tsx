import { ReactElement } from "react";

import { SpreadsheetImport } from "@/components/SpreadsheetImport";

export default function CockpitAdminOfiiImport(): ReactElement {
  return (
    <SpreadsheetImport endpoint="/api/ofii-imports" label="Fichier OFII" />
  );
}
