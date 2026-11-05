import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { MultiInformationCard } from "@/app/components/MultiInformationCard";
import { getCurrentYear } from "@/app/utils/now.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const FinanceCards = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYear = statistiques.finance.byYear.find(
    (yearItem) => yearItem.year === getCurrentYear()
  );

  if (!currentYear) {
    return <></>;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <MultiInformationCard
        informations={[
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.total.dotationAccordee}
                type="currency"
                compact={true}
              />
            ),
            secondaryInformation: "dotation totale annuelle versée par l'État",
          },
          {
            primaryInformation: (
              <>
                <span className="text-sm">dont </span>
                <NumberDisplay
                  value={currentYear.autorisees.dotationAccordee}
                  type="currency"
                  compact={true}
                />
              </>
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <>
                <span className="text-sm">dont </span>
                <NumberDisplay
                  value={currentYear.subventionnees.dotationAccordee}
                  type="currency"
                  compact={true}
                />
              </>
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="ensemble des employés des structures sélectionnées"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={currentYear.total.totalETPPrevisionnel}
              />
            ),
            secondaryInformation: "nombre prévisionnel d'ETP au total",
          },
          {
            primaryInformation: (
              <>
                <span className="text-sm">dont </span>
                <NumberDisplay
                  showZero={false}
                  value={currentYear.autorisees.totalETPPrevisionnel}
                />
              </>
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <>
                <span className="text-sm">dont </span>
                <NumberDisplay
                  showZero={false}
                  value={currentYear.subventionnees.totalETPPrevisionnel}
                />
              </>
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="nombre de places autorisées des structures sélectionnées divisé par le nombre total d'ETP"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={currentYear.total.tauxEncadrementTheoriquePrevisionnel}
              />
            ),
            secondaryInformation:
              "taux d'encadrement théorique prévisionnel moyen",
          },
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={
                  currentYear.autorisees.tauxEncadrementTheoriquePrevisionnel
                }
              />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={
                  currentYear.subventionnees
                    .tauxEncadrementTheoriquePrevisionnel
                }
              />
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="coût moyen d'une structure pour une journée et pour une place"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={currentYear.total.coutJournalierTheorique}
                type="currency"
              />
            ),
            secondaryInformation:
              "coût place journalier théorique prévisionnel moyen",
          },
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={currentYear.autorisees.coutJournalierTheorique}
                type="currency"
              />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay
                showZero={false}
                value={currentYear.subventionnees.coutJournalierTheorique}
                type="currency"
              />
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
    </div>
  );
};
