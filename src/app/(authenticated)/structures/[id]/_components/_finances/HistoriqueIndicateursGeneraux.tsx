import Table from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { CustomAccordion } from "@/app/components/common/CustomAccordion";
import { formatCurrency, formatNumber } from "@/app/utils/number.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const HistoriqueIndicateursGeneraux = (): ReactElement => {
  const { structure } = useStructureContext();

  const getBudgets = () => {
    if (!structure?.budgets) {
      return [];
    }
    return structure.budgets.map((budget) => [
      <span className="inline-block text-center w-full" key={budget.id}>
        {budget.year}
      </span>,
      <span className="inline-block text-center w-full" key={budget.id}>
        {formatNumber(budget.ETP)}
      </span>,
      <span className="inline-block text-center w-full" key={budget.id}>
        {formatNumber(budget.tauxEncadrement)}
      </span>,
      <span className="inline-block w-20 text-center" key={budget.id}>
        {formatCurrency(budget.coutJournalier)}
      </span>,
    ]);
  };

  return (
    <CustomAccordion
      label={
        isStructureAutorisee(structure.type)
          ? "Historique selon compte administratif"
          : "Historique selon compte-rendu financier"
      }
    >
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getBudgets()}
        headers={["ANNÉE", "ETP", "TAUX D'ENCADREMENT", "COÛT JOURNALIER"]}
      />
    </CustomAccordion>
  );
};
