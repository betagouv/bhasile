import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactElement, useState } from "react";

import styles from "@/app/components/common/Accordion.module.css";
import { formatCurrency } from "@/app/utils/number.util";
import { isStructureInCpom } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

const commentaireModal = createModal({
  id: "commentaire-modal",
  isOpenedByDefault: false,
});

export const DetailAffectations = (): ReactElement => {
  const { structure } = useStructureContext();
  const [selectedComment, setSelectedComment] = useState<
    string | null | undefined
  >(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const isBudgetFilled = (budget: BudgetApiType): boolean => {
    return !!budget.affectationReservesFondsDedies;
  };

  const getBudgets = () => {
    if (!structure?.budgets) {
      return [];
    }
    return structure.budgets.filter(isBudgetFilled).map((budget) => [
      budget.year,
      <span key={budget.id}>
        {formatCurrency(budget.affectationReservesFondsDedies)}
      </span>,
      <span key={budget.id}>
        {formatCurrency(budget.reserveInvestissement)}
      </span>,
      <span key={budget.id}>
        {formatCurrency(budget.chargesNonReconductibles)}
      </span>,
      <span key={budget.id}>
        {formatCurrency(budget.reserveCompensationDeficits)}
      </span>,
      <span key={budget.id}>
        {formatCurrency(budget.reserveCompensationBFR)}
      </span>,
      <span key={budget.id}>
        {formatCurrency(budget.reserveCompensationAmortissements)}
      </span>,
      isStructureInCpom(structure) && (
        <span key={budget.id}>{formatCurrency(budget.fondsDedies)}</span>
      ),
      <span key={budget.id}>{formatCurrency(budget.reportANouveau)}</span>,
      <span key={budget.id}>{formatCurrency(budget.autre)}</span>,
      <Button
        key={budget.id}
        className="fr-btn fr-btn--tertiary-no-outline fr-icon-eye-line fr-btn--icon-left"
        onClick={() => {
          setSelectedComment(budget.commentaire);
          setSelectedYear(budget.year);
          setTimeout(() => {
            commentaireModal.open();
          }, 0);
        }}
      >
        Voir
      </Button>,
    ]);
  };

  if (getBudgets().length === 0) {
    return <></>;
  }

  return (
    <>
      <Accordion
        label={
          isStructureInCpom(structure)
            ? "Détail affectations réserves, provisions et fonds dédiés du CPOM"
            : "Détail affectations réserves et provisions"
        }
        className={styles["custom-accordion"]}
      >
        <Table
          bordered={true}
          className="m-0 [&>table]:w-[unset] [&>table>tbody>tr>td]:text-center text-mention-grey [&>table>thead]:text-mention-grey [&>table>thead>tr>th]:text-center"
          caption=""
          data={getBudgets()}
          headers={[
            "ANNÉE",
            "TOTAL",
            "RÉSERVE DÉDIÉE À L'INVESTISSMENT",
            "CHARGES NON RECONDUCTIBLES",
            "RÉSERVE DE COMPENSATION DES DÉFICITS",
            "RÉSERVE DE COUVERTURE DE BFR",
            "RÉSERVE DE COMPENSATION DES AMORTIS.",
            isStructureInCpom(structure) && "FONDS DÉDIÉS",
            "REPORT A NOUVEAU",
            "AUTRE",
            "COMMENTAIRE",
          ]}
        />
        <span className="text-sm m-3">
          Ce tableau reflète l’affectation de l’excédent pour chaque année
          (flux). Il ne constitue en aucun cas un calcul ou stock.
        </span>
      </Accordion>
      <commentaireModal.Component title="Voir le commentaire">
        <h2 className="text-sm">
          {isStructureInCpom(structure)
            ? `Détail affectation du résultat du CPOM - Année ${selectedYear}`
            : `Détail affectation du résultat - Année ${selectedYear}`}
        </h2>
        <p>{selectedComment}</p>
      </commentaireModal.Component>
    </>
  );
};
