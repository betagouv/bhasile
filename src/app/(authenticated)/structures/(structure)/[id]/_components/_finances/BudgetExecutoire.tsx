import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { isYearRealisee } from "@/app/utils/indicateurFinancier.util";
import { formatCurrency, formatNumber } from "@/app/utils/number.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const BudgetExecutoire = ({ year }: Props): ReactElement => {
  const { structure } = useStructureContext();
  const budget = structure.budgets?.find((budget) => budget.year === year);
  const indicateursFinanciersOfYear = structure.indicateursFinanciers?.filter(
    (indicateurFinancier) => indicateurFinancier.year === year
  );

  const isRealisee = isYearRealisee(
    structure?.indicateursFinanciers ?? [],
    year
  );

  const indicateurFinancier = indicateursFinanciersOfYear?.find(
    (indicateurFinancier) =>
      indicateurFinancier.type === (isRealisee ? "REALISE" : "PREVISIONNEL")
  );

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
          primaryInformation={formatNumber(indicateurFinancier?.ETP)}
          secondaryInformation="ETP"
        />
      </div>
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatNumber(
            indicateurFinancier?.tauxEncadrement
          )}
          secondaryInformation="places gérées par un ETP"
        />
      </div>
      <div className="pr-4">
        <InformationCard
          primaryInformation={formatCurrency(
            indicateurFinancier?.coutJournalier
          )}
          secondaryInformation="coût place journalier"
        />
      </div>
    </div>
  );
};

type Props = {
  year: number;
};
