import { ReactElement } from "react";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { GenericTypeChart } from "./GenericTypeChart";

export const TypesBatis = (): ReactElement => {
  const colors = [
    "var(--blue-cumulus-main-526)",
    "var(--yellow-moutarde-850-200)",
    "var(--purple-glycine-main-494)",
  ];

  return (
    <GenericTypeChart
      title={
        <>
          Types de bâtis en {new Date().getFullYear()}{" "}
          {/* TODO : mettre de vrais chiffres ici */}
          <IncompleteDataIndicator
            nbStructures={42}
            structuresPercentage={42}
          />
        </>
      }
      colors={colors}
      typeAccessor="structureBatis"
    />
  );
};
