import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

const sections = [
  {
    title: "Structures",
    icon: "fr-icon-community-line",
    items: [
      { label: "Nombre de structures", value: "totalStructures" },
      { label: "Nombre de structures en CPOM", value: "totalStructuresCpom" },
    ],
  },
  {
    title: "Types de places",
    icon: "fr-icon-map-pin-2-line",
    items: [
      { label: "Nombre de places autorisées", value: "placesAutorisees" },
      { label: "Nombre de places PMR", value: "placesPmr" },
      { label: "Nombre de places LGBT", value: "placesLgbt" },
      { label: "Nombre de places FVV-TEH", value: "placesFvvTeh" },
      { label: "Nombre de places en QPV", value: "placesQpv" },
      {
        label: "Nombre de places en logement social",
        value: "placesLogementSocial",
      },
    ],
  },
  {
    title: "Finance",
    icon: "fr-icon-money-euro-box-line",
    items: [
      {
        label: "Dotation annuelle totale versée par l’État",
        value: "dotationAccordee",
      },
      { label: "Nombre d’ETP", value: "ETP" },
      { label: "Taux d’encadrement", value: "tauxEncadrement" },
      { label: "Coût journalier", value: "coutJournalier" },
      {
        label: "Excédents et déficits",
        value: "excedentsDeficits",
      },
    ],
  },
  {
    title: "Contrôle qualité",
    icon: "fr-icon-search-line",
    items: [
      { label: "Nombre d’EIG", value: "nbEig" },
      {
        label: "Pourcentage d’EIG au motif de comportement violent",
        value: "percentageEigComportementViolent",
      },
      { label: "Moyenne aux évaluations", value: "moyenneEvaluations" },
    ],
  },
  {
    title: "Activité",
    icon: "fr-icon-user-setting-line",
    items: [
      {
        label: "Nombre de places enregistrées dans le DNA",
        value: "placesEnregistreesDna",
      },
      {
        label: "Nombre de places indisponibles",
        value: "placesIndisponibles",
      },
      { label: "Nombre de places occupées", value: "placesOccupees" },
      { label: "Nombre de places en présence indue", value: "presencesIndues" },
    ],
  },
  {
    title: "Référés Mesures Utiles",
    icon: "fr-icon-article-line",
    items: [
      {
        label: "Nombre de référés mesures utiles engagés",
        value: "rmuEngages",
      },
      {
        label: "Nombre de référés mesures utiles exécutés",
        value: "rmuExecutes",
      },
    ],
  },
];

export const CartographieMenu = (): ReactElement => {
  const [activeItem, setActiveItem] = useState("nbStructures");

  return (
    <aside className="bg-white w-120 border-r border-default-grey sticky overflow-y-auto top-16 max-h-[calc(100vh-64px)]">
      {sections.map((section, index) => (
        <div key={section.title} className="px-5 pt-5">
          <h2 className="text-lg font-bold text-title-blue-france flex items-center">
            <span className={`${section.icon} mr-3`} aria-hidden="true" />
            {section.title}
          </h2>
          <div className="flex flex-col pl-2">
            {section.items.map((item) => {
              const isActive = activeItem === item.value;
              return (
                <Button
                  key={item.value}
                  onClick={() => setActiveItem(item.value)}
                  iconId="fr-icon-arrow-right-line"
                  iconPosition="right"
                  priority="tertiary no outline"
                  className={`
                    w-full font-normal! py-2! m-0! text-sm whitespace-normal
                    ${isActive ? "bg-[#eee]! text-black! font-semibold" : "text-[#3a3a3a]!"}
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
