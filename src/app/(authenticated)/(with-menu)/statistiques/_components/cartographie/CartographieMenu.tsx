"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { DEFAULT_CARTOGRAPHIE_INDICATEUR } from "@/schemas/api/statistique-cartographie.schema";

const sections = [
  {
    title: "Structures",
    icon: "fr-icon-community-line",
    items: [
      { label: "Nombre de structures", value: "structures.total" },
      { label: "Nombre de structures en CPOM", value: "structures.avecCpom" },
    ],
  },
  {
    title: "Types de places",
    icon: "fr-icon-map-pin-2-line",
    items: [
      { label: "Nombre de places autorisées", value: "places.autorisees" },
      { label: "Nombre de places PMR", value: "places.pmr" },
      { label: "Nombre de places LGBT", value: "places.lgbt" },
      { label: "Nombre de places FVV-TEH", value: "places.fvvTeh" },
      { label: "Nombre de places en QPV", value: "places.qpv" },
      {
        label: "Nombre de places en logement social",
        value: "places.logementsSociaux",
      },
    ],
  },
  {
    title: "Finance",
    icon: "fr-icon-money-euro-box-line",
    items: [
      {
        label: "Dotation annuelle totale versée par l’État",
        value: "finance.dotationAccordee",
      },
      { label: "Nombre d’ETP", value: "finance.etp" },
      { label: "Taux d’encadrement", value: "finance.tauxEncadrement" },
      { label: "Coût journalier", value: "finance.coutJournalier" },
      {
        label: "Excédents et déficits",
        value: "finance.resultatNet",
      },
    ],
  },
  {
    title: "Contrôle qualité",
    icon: "fr-icon-search-line",
    items: [
      { label: "Nombre d’EIG", value: "controleQualite.nbEig" },
      {
        label: "Pourcentage d’EIG au motif de comportement violent",
        value: "controleQualite.tauxEigComportementViolent",
      },
      {
        label: "Moyenne aux évaluations",
        value: "controleQualite.moyenneEvaluations",
      },
    ],
  },
  {
    title: "Activité",
    icon: "fr-icon-user-setting-line",
    items: [
      {
        label: "Nombre de places enregistrées dans le DNA",
        value: "activite.placesDna",
      },
      {
        label: "Nombre de places indisponibles",
        value: "activite.placesIndisponibles",
      },
      { label: "Nombre de places occupées", value: "activite.placesOccupees" },
      {
        label: "Nombre de places en présence indue",
        value: "activite.presencesIndues",
      },
    ],
  },
  {
    title: "Référés Mesures Utiles",
    icon: "fr-icon-article-line",
    items: [
      {
        label: "Nombre de référés mesures utiles engagés",
        value: "rmu.referesEngages",
      },
      {
        label: "Nombre de référés mesures utiles exécutés",
        value: "rmu.referesExecutes",
      },
    ],
  },
];

export const CartographieMenu = (): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndicator =
    searchParams.get("indicateur") || DEFAULT_CARTOGRAPHIE_INDICATEUR;

  const handleIndicatorChange = (indicatorValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("indicateur", indicatorValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside className="bg-white w-120 border-r border-default-grey overflow-y-auto max-h-[calc(100vh-var(--structure-header-height))]">
      {sections.map((section, index) => (
        <div key={section.title} className="px-5 pt-5">
          <h2 className="text-lg font-bold text-title-blue-france flex items-center">
            <span className={`${section.icon} mr-3`} aria-hidden="true" />
            {section.title}
          </h2>
          <div className="flex flex-col pl-2">
            {section.items.map((item) => {
              const isActive = currentIndicator === item.value;
              return (
                <Button
                  key={item.value}
                  onClick={() => handleIndicatorChange(item.value)}
                  iconId="fr-icon-arrow-right-line"
                  iconPosition="right"
                  priority="tertiary no outline"
                  className={`
                    w-full font-normal! py-2! m-0! text-sm whitespace-normal
                    ${isActive ? "bg-alt-grey! text-black!" : "text-title-grey!"}
                  `}
                  style={{
                    textAlign: "left",
                  }}
                >
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
          {index < sections.length - 1 && (
            <hr className="mt-6 -mx-5 border-default-grey" />
          )}
        </div>
      ))}
    </aside>
  );
};
