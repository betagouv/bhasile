import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { MultiInformationCard } from "@/app/components/MultiInformationCard";

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
            primaryInformation: (
              <NumberDisplay
                value={currentYear.total.dotationAccordee}
                type="currency"
                compact={true}
              />
            ),
            secondaryInformation: "dotation totale annuelle versée par l'Etat",
          },
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.autorisees.dotationAccordee}
                type="currency"
                compact={true}
              />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.subventionnees.dotationAccordee}
                type="currency"
                compact={true}
              />
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="ensemble des employés de la structure"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay value={currentYear.total.totalETP} />
            ),
            secondaryInformation: "ETP au total",
          },
          {
            primaryInformation: (
              <NumberDisplay value={currentYear.autorisees.totalETP} />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay value={currentYear.subventionnees.totalETP} />
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="nombre de places gérées par un ETP"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay value={currentYear.total.tauxEncadrement!} />
            ),
            secondaryInformation: "taux d'encadrement moyen",
          },
          {
            primaryInformation: (
              <NumberDisplay value={currentYear.autorisees.tauxEncadrement!} />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.subventionnees.tauxEncadrement!}
              />
            ),
            secondaryInformation: "pour les structures subventionnées",
          },
        ]}
      />
      <MultiInformationCard
        detailLabel="coût de la structure pour une journée et pour une place"
        informations={[
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.total.coutJournalier}
                type="currency"
              />
            ),
            secondaryInformation: "coût place journalier moyen",
          },
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.autorisees.coutJournalier}
                type="currency"
              />
            ),
            secondaryInformation: "pour les structures autorisées",
          },
          {
            primaryInformation: (
              <NumberDisplay
                value={currentYear.subventionnees.coutJournalier}
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
