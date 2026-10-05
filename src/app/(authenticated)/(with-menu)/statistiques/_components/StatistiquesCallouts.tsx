"use client";

import { ReactElement } from "react";

import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const StatistiquesCallouts = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const callouts: Callout[] = [
    {
      icon: "fr-icon-team-line",
      value: statistiques.places.totalPlaces.toLocaleString("fr-FR"),
      titre: "places autorisées comptabilisées sur Bhasile",
      description:
        "(somme des derniers chiffres en date issus des structures actives sur l’outil)",
    },
    {
      icon: "fr-icon-community-line",
      value: statistiques.structures.totalStructures.toLocaleString("fr-FR"),
      titre: "structures d’hébergement comptabilisées sur Bhasile",
      description:
        "(parc hors PRAHDA, nuitées hôtelières et structures non initialisées dans l’outil)",
    },
    {
      icon: "ri-exchange-2-line",
      value: statistiques.structures.totalCpoms.toLocaleString("fr-FR"),
      titre: "CPOM complets ou partiels comptabilisés sur Bhasile",
      description:
        "(les CPOM partiels ont des structures en dehors de la zone définie dans les filtres)",
    },
  ];

  return (
    <div className="p-6 print:pb-2 print:pt-0 print:px-0">
      <h3 className="text-title-blue-france fr-h6 mb-6">
        En prenant en compte les filtres définis, il y a actuellement
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {callouts.map((callout) => (
          <div
            key={callout.titre}
            className="border-l-2 border-text-title-blue-france pl-4 flex flex-col justify-start"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`${callout.icon} text-title-blue-france before:h-10! before:w-10!`}
                aria-hidden="true"
              />
              <span className="text-5xl font-bold text-title-blue-france">
                {callout.value}
              </span>
            </div>
            <p className="font-bold text-title-blue-france mb-2">
              {callout.titre}
            </p>
            <p className="text-xs text-title-grey">{callout.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface Callout {
  icon: string;
  value: string;
  titre: string;
  description: string;
}
