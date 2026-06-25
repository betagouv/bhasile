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
              primaryInformation: formatCurrency(statistiques.dotationAnnuelle),
              secondaryInformation:
                "dotation totale annuelle versée par l'Etat",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.dotationAutorisees
              ),
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.dotationSubventionnees
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
              primaryInformation: statistiques.ETP,
              secondaryInformation: "ETP au total",
            },
            {
              primaryInformation: statistiques.ETPAutorisees,
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: statistiques.ETPSubventionnees,
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
              primaryInformation: statistiques.tauxEncadrement,
              secondaryInformation: "taux encadrement moyen",
            },
            {
              primaryInformation: statistiques.tauxEncadrementAutorisees,
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: statistiques.tauxEncadrementSubventionnees,
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
              primaryInformation: formatCurrency(statistiques.coutJournalier),
              secondaryInformation: "coût place journalier moyen",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.coutJournalierAutorisees
              ),
              secondaryInformation: "pour les structures autorisées",
            },
            {
              primaryInformation: formatCurrency(
                statistiques.coutJournalierSubventionnees
              ),
              secondaryInformation: "pour les structures subventionnées",
            },
          ]}
        />
      </div>
    </>
  );
};
