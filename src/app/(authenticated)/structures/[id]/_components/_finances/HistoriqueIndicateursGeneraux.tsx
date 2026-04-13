import Table from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { CustomAccordion } from "@/app/components/common/CustomAccordion";
import { formatCurrency, formatNumber } from "@/app/utils/number.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const HistoriqueIndicateursGeneraux = (): ReactElement => {
  const { structure } = useStructureContext();

  const getIndicateursFinanciers = () => {
    if (!structure?.indicateursFinanciers) {
      return [];
    }
    return structure.indicateursFinanciers.map((indicateurFinancier) => [
      <span
        className="inline-block text-center w-full"
        key={indicateurFinancier.id}
      >
        {indicateurFinancier.year} {indicateurFinancier.type}
      </span>,
      <span
        className="inline-block text-center w-full"
        key={indicateurFinancier.id}
      >
        {formatNumber(indicateurFinancier.ETP)}
      </span>,
      <span
        className="inline-block text-center w-full"
        key={indicateurFinancier.id}
      >
        {formatNumber(indicateurFinancier.tauxEncadrement)}
      </span>,
      <span
        className="inline-block w-20 text-center"
        key={indicateurFinancier.id}
      >
        {formatCurrency(indicateurFinancier.coutJournalier)}
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
        data={getIndicateursFinanciers()}
        headers={["ANNÉE", "ETP", "TAUX D'ENCADREMENT", "COÛT JOURNALIER"]}
      />
    </CustomAccordion>
  );
};
