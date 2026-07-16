import { ReactElement } from "react";

import { MultiInformationCard } from "@/app/components/MultiInformationCard";
import { formatCurrency } from "@/app/utils/number.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const FinanceCards = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYear =
    statistiques.finance.byYear[statistiques.finance.byYear.length - 1];

  return (
    <div className="grid grid-cols-4 gap-4">
      <MultiInformationCard
        informations={[
          {
            primaryInformation: formatCurrency(
              currentYear.total.dotationAccordee
            ),
            secondaryInformation: "dotation totale annuelle versée par l'Etat",
          },
          {
            primaryInformation: formatCurrency(
              currentYear.autorisees.dotationAccordee
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: formatCurrency(
              currentYear.subventionnees.dotationAccordee
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="ensemble des employés de la structure"
        informations={[
          {
            primaryInformation: currentYear.total.totalETP,
            secondaryInformation: "ETP au total",
          },
          {
            primaryInformation: currentYear.autorisees.totalETP,
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: currentYear.subventionnees.totalETP,
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="nombre de places gérées par un ETP"
        informations={[
          {
            primaryInformation: currentYear.total.tauxEncadrement!,
            secondaryInformation: "taux d'encadrement moyen",
          },
          {
            primaryInformation: currentYear.autorisees.tauxEncadrement!,
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: currentYear.subventionnees.tauxEncadrement!,
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="coût de la structure pour une journée et pour une place"
        informations={[
          {
            primaryInformation: formatCurrency(
              currentYear.total.coutJournalier
            ),
            secondaryInformation: "coût place journalier moyen",
          },
          {
            primaryInformation: formatCurrency(
              currentYear.autorisees.coutJournalier
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: formatCurrency(
              currentYear.subventionnees.coutJournalier
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
    </div>
  );
};
