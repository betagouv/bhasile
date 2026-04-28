import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMemo } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import {
  getCpomStructureIndexAndBudgetIndexForAYearAndAType,
  getMillesimeIndexForAYear,
} from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

export const BudgetTableCommentStaticButtonAndModal = ({
  type,
  year,
  budgets,
  cpomStructures,
}: Props) => {
  const modal = useMemo(
    () =>
      createModal({
        id: `${budgets ? "budgets" : "cpomStructures"}-${year}-commentaire-static-modal`,
        isOpenedByDefault: false,
      }),
    [budgets, year]
  );

  let currentComment: string | undefined | null;

  if (budgets) {
    currentComment =
      budgets?.[getMillesimeIndexForAYear(budgets, year, type)]?.commentaire;
  }
  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type
      );
    currentComment =
      cpomStructures[cpomStructureIndex]?.cpom?.budgets?.[budgetIndex]
        ?.commentaire;
  }

  const handleOpenModal = () => {
    modal.open();
  };

  return (
    <>
      {currentComment ? (
        <Button
          type="button"
          iconId="fr-icon-eye-line"
          onClick={() => {
            handleOpenModal();
          }}
          priority="tertiary no outline"
          size="small"
          className="font-bold"
        >
          Voir
        </Button>
      ) : (
        <EmptyCell />
      )}
      <modal.Component
        title="Voir le commentaire"
        className="[&_h1]:text-left! [&_h2]:text-left! [&_p]:text-left!"
      >
        <h2 className="text-sm">Détail affectation du résultat - {year}</h2>
        <p>{currentComment}</p>
      </modal.Component>
    </>
  );
};

type Props = {
  type?: StructureType;
  year: number;
  cpomStructures?: CpomStructureApiWrite[];
  budgets?: BudgetApiType[];
};
