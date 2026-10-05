import { ReactElement } from "react";

import { ClosedStructuresDisclaimer } from "./ClosedStructuresDisclaimer";

export const AnnualDataNote = (): ReactElement => (
  <div className="italic text-sm pt-3">
    Les chiffres correspondent au 31 décembre de chaque année, et à la dernière
    mise à jour pour l’année en cours.
    <ClosedStructuresDisclaimer />
  </div>
);
