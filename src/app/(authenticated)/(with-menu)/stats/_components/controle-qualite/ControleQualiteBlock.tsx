"use client";

import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { InformationCardBridge } from "@/app/components/InformationCardBridge";
import { formatNumber } from "@/app/utils/number.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { ControleQualiteStatsTable } from "./ControleQualiteStatsTable";
import { EIGChart } from "./EIGChart";
import { EvaluationChart } from "./EvaluationChart";

export const ControleQualiteBlock = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const tauxEigComportementViolent = formatNumber(
    Number(statistiques.controleQualite.eig.tauxEigComportementViolent),
    {
      maximumFractionDigits: 1,
    }
  );

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-search-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">
            Contrôle qualité
          </h3>
        </div>
      </div>
      <div className="flex pb-16">
        <div>
          <InformationCard
            primaryInformation={`${statistiques.controleQualite.eig.nbEig} EIG`}
            secondaryInformation="pour 1000 places sur les 12 derniers mois"
          />
        </div>
        <InformationCardBridge />
        <div className="pr-4">
          <InformationCard
            primaryInformation={`dont ${statistiques.controleQualite.eig.nbEigComportementViolent} (${tauxEigComportementViolent}%)`}
            secondaryInformation="au motif de comportements violents"
          />
        </div>
        <div>
          <InformationCard
            primaryInformation={`${statistiques.controleQualite.eig.moyenneEvaluationsLast12Months || "N/A"} / 4`}
            secondaryInformation={`moyenne aux évaluations sur les 12 derniers mois`}
          />
        </div>
      </div>
      <div className="pb-16">
        <EIGChart />
      </div>
      <div className="pb-16">
        <EvaluationChart />
      </div>
      <ControleQualiteStatsTable />
    </div>
  );
};
