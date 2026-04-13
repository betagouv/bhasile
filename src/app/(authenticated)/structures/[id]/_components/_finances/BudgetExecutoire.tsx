import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { formatCurrency, formatNumber } from "@/app/utils/number.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const BudgetExecutoire = ({ year }: Props): ReactElement => {
  const { structure } = useStructureContext();
  const budget = structure?.budgets?.find((budget) => budget.year === year);
  const indicateursFinanciersOfYear = structure?.indicateursFinanciers?.filter(
    (indicateurFinancier) => indicateurFinancier.year === year
  );
  const indicateurFinancierRealise = indicateursFinanciersOfYear?.find(
    (indicateurFinancier) => indicateurFinancier.type === "REALISE"
  );
  const indicateurFinancierPrevisionnel = indicateursFinanciersOfYear?.find(
    (indicateurFinancier) => indicateurFinancier.type === "PREVISIONNEL"
  );
  const ETP =
    indicateurFinancierRealise?.ETP ??
    indicateurFinancierPrevisionnel?.ETP ??
    0;
  const tauxEncadrement =
    indicateurFinancierRealise?.tauxEncadrement ??
    indicateurFinancierPrevisionnel?.tauxEncadrement ??
    0;
  const coutJournalier =
    indicateurFinancierRealise?.coutJournalier ??
    indicateurFinancierPrevisionnel?.coutJournalier ??
    0;

  return (
    <div className="flex">
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatCurrency(budget?.dotationAccordee)}
          secondaryInformation="dotation globale de financement"
        />
      </div>
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatNumber(ETP)}
          secondaryInformation="ETP"
        />
      </div>
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatNumber(tauxEncadrement)}
          secondaryInformation="places gérées par un ETP"
        />
      </div>
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatCurrency(coutJournalier)}
          secondaryInformation="coût place journalier"
        />
      </div>
    </div>
  );
};

type Props = {
  year: number;
};
