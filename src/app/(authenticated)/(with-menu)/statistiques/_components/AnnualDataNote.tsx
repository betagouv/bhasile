import { ReactElement } from "react";

export const AnnualDataNote = (): ReactElement => (
  <div className="italic text-sm pt-3">
    Les chiffres correspondent au 31 décembre de chaque année, et à la dernière
    mise à jour pour l’année en cours. Seules les structures actualisées au
    cours de l’année sont comptabilisées : tant que la campagne d’actualisation
    n’est pas terminée, les chiffres de l’année restent partiels.
  </div>
);
