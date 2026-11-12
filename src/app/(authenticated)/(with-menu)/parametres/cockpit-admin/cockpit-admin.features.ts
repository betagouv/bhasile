import { CockpitFeature, CockpitSection } from "@/types/cockpit-admin.type";

export const COCKPIT_ADMIN_URL = "/parametres/cockpit-admin";

export const COCKPIT_SECTIONS: CockpitSection[] = [
  {
    title: "Imports de données",
    features: [
      {
        title: "Import OFII",
        description:
          "Charger le fichier mensuel de l’OFII pour mettre à jour le référentiel des structures et leur activité, et rattacher les opérateurs inconnus à leur alias.",
        icon: "fr-icon-upload-2-line",
        href: `${COCKPIT_ADMIN_URL}/import-ofii`,
        isEnabled: false,
      },
      {
        title: "Import RMU",
        description:
          "Charger le fichier de suivi RMU pour mettre à jour les données par département.",
        icon: "fr-icon-upload-2-line",
        href: `${COCKPIT_ADMIN_URL}/import-rmu`,
        isEnabled: false,
      },
    ],
  },
  {
    title: "Campagnes",
    features: [
      {
        title: "Annonces",
        description:
          "Publier, modifier ou retirer les messages affichés aux utilisateurs.",
        icon: "fr-icon-megaphone-line",
        href: `${COCKPIT_ADMIN_URL}/annonces`,
        isEnabled: false,
      },
      {
        title: "Campagne d’actualisation",
        description:
          "Ouvrir la campagne d’actualisation de l’année et fixer sa date limite.",
        icon: "fr-icon-survey-line",
        href: `${COCKPIT_ADMIN_URL}/actualisation`,
        isEnabled: false,
      },
      {
        title: "Passage à l’année suivante",
        description: "Faire avancer les années ouvertes à la saisie.",
        icon: "fr-icon-calendar-event-line",
        href: `${COCKPIT_ADMIN_URL}/millesimes`,
        isEnabled: false,
      },
    ],
  },
  {
    title: "FAQ",
    features: [
      {
        title: "Questions de la FAQ",
        description:
          "Ajouter, modifier ou supprimer les questions de la page Modèles et ressources.",
        icon: "fr-icon-question-answer-line",
        href: `${COCKPIT_ADMIN_URL}/faq`,
        isEnabled: true,
      },
      {
        title: "Documents de la FAQ",
        description:
          "Ajouter ou supprimer les documents téléchargeables de la page Modèles et ressources.",
        icon: "fr-icon-file-text-line",
        href: `${COCKPIT_ADMIN_URL}/documents-faq`,
        isEnabled: false,
      },
    ],
  },
  {
    title: "Utilisateurs",
    features: [
      {
        title: "Utilisateurs et droits",
        description:
          "Créer des périmètres, valider des agents et les rattacher à un périmètre.",
        icon: "fr-icon-team-line",
        href: "/parametres/acces",
        isEnabled: false,
      },
    ],
  },
];

export const findCockpitFeature = (pathname: string): CockpitFeature | null =>
  COCKPIT_SECTIONS.flatMap((section) => section.features).find(
    (feature) =>
      pathname === feature.href || pathname.startsWith(`${feature.href}/`)
  ) ?? null;
