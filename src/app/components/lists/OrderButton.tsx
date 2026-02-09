import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { CpomColumn, StructureColumn } from "@/types/ListColumn";

export const OrderButton = ({
  column,
  currentColumn,
  currentDirection,
  handleOrdering,
}: Props): ReactElement => {
  let ariaSort: "ascending" | "descending" | "none" = "none";
  if (column === currentColumn && currentDirection === "asc") {
    ariaSort = "ascending";
  } else if (column === currentColumn && currentDirection === "desc") {
    ariaSort = "descending";
  }
  if (
    !currentColumn &&
    !currentDirection &&
    column === "departementAdministratif"
  ) {
    ariaSort = "ascending";
  }
  return (
    <Button
      priority="tertiary no outline"
      onClick={() => handleOrdering(column)}
      className="relative"
      size="small"
      aria-label={
        ariaSort === "descending"
          ? "Supprimer le tri"
          : `Trier par ${column} ${ariaSort === "ascending" ? "décroissant" : "croissant"}`
      }
      aria-sort={ariaSort}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 fr-icon-arrow-up-s-line text-disabled-grey",
          ariaSort === "ascending"
            ? "text-title-blue-france"
            : "text-disabled-grey fr-icon--sm"
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 fr-icon-arrow-down-s-line text-disabled-grey",
          ariaSort === "descending"
            ? "text-title-blue-france"
            : "text-disabled-grey fr-icon--sm"
        )}
      />
    </Button>
  );
};

type Props = {
  column: StructureColumn | CpomColumn;
  currentColumn: StructureColumn | CpomColumn | null;
  currentDirection: "asc" | "desc" | null;
  handleOrdering: (column: StructureColumn | CpomColumn) => void;
};
