import { ReactElement } from "react";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { GenericTypeChart } from "./GenericTypeChart";

export const TypesStructures = (): ReactElement => {
  const colors = [
    "var(--green-tilleul-verveine-main-707)",
    "var(--green-archipel-main-557)",
    "var(--blue-ecume-main-400)",
    "var(--brown-cafe-creme-main-782)",
    "var(--orange-terre-battue-main-645)",
  ];

  return (
    <GenericTypeChart
      title={
        <>
          Types de structures en {new Date().getFullYear()}{" "}
          {/* TODO : mettre de vrais chiffres ici */}
          <IncompleteDataIndicator
            nbStructures={42}
            structuresPercentage={42}
          />
        </>
      }
      colors={colors}
      typeAccessor="structureTypes"
    />
  );
};
