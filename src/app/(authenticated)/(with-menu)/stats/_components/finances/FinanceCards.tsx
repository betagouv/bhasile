import { ReactElement } from "react";

import { MultiInformationCard } from "@/app/components/MultiInformationCard";
import { formatCurrency } from "@/app/utils/number.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const FinanceCards = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  return (
    <>
      <div className="pr-4">
        <MultiInformationCard
          informations={[
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].total.dotationAccordee
              ),
              secondaryInformation:
                "dotation totale annuelle versée par l'Etat",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].autorisees.dotationAccordee
              ),
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].subventionnees.dotationAccordee
              ),
              secondaryInformation: "pour les structures subventionnées",
            },
          ]}
        />
      </div>
      <div className="pr-4">
        <MultiInformationCard
          detailLabel="ensemble des employés de la structure"
          informations={[
            {
              primaryInformation: statistiques.finance.byYear[0].total.totalETP,
              secondaryInformation: "ETP au total",
            },
            {
              primaryInformation:
                statistiques.finance.byYear[0].autorisees.totalETP,
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation:
                statistiques.finance.byYear[0].subventionnees.totalETP,
              secondaryInformation: "pour les structures subventionnées",
            },
          ]}
        />
      </div>
      <div className="pr-4">
        <MultiInformationCard
          detailLabel="nombre de places gérées par un ETP"
          informations={[
            {
              primaryInformation:
                statistiques.finance.byYear[0].total.tauxEncadrement!,
              secondaryInformation: "taux encadrement moyen",
            },
            {
              primaryInformation:
                statistiques.finance.byYear[0].autorisees.tauxEncadrement!,
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation:
                statistiques.finance.byYear[0].subventionnees.tauxEncadrement!,
              secondaryInformation: "pour les structures subventionnées",
            },
          ]}
        />
      </div>
      <div>
        <MultiInformationCard
          detailLabel="coût de la structure pour une journée et pour une place"
          informations={[
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].total.coutJournalier
              ),
              secondaryInformation: "coût place journalier moyen",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].autorisees.coutJournalier
              ),
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.finance.byYear[0].subventionnees.coutJournalier
              ),
              secondaryInformation: "pour les structures subventionnées",
            },
          ]}
        />
      </div>
    </>
  );
};
