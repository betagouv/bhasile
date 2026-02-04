import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMemo } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";

export const BudgetTableCommentStaticButtonAndModal = ({
  year,
  budgets,
}: Props) => {
  const modal = useMemo(
    () =>
      createModal({
        id: `${budgets ? "budgets" : "cpomStructures"}-${year}-commentaire-static-modal`,
        isOpenedByDefault: false,
      }),
    [budgets, year]
  );

  const currentComment =
    budgets?.[getMillesimeIndexForAYear(budgets, year)]?.commentaire;

  const handleOpenModal = () => {
    modal.open();
  };

  return (
    <>
      {currentComment ? (
        <Button
          type="button"
          iconId="fr-icon-edit-box-line"
          onClick={() => {
            handleOpenModal();
          }}
          priority="tertiary no outline"
          size="small"
        >
          Voir
        </Button>
      ) : (
        <EmptyCell />
      )}
      <modal.Component title="Voir le commentaire">
        <h2 className="text-sm">
          Détail affectation du résultat - Année {year}
        </h2>
        <p>{currentComment}</p>
      </modal.Component>
    </>
  );
};

type Props = {
  year: number;
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  budgets?: BudgetApiType[];
};
