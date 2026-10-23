import { SessionUser } from "@/types/global";

import { isOperateurUser } from "./session.util";

const agentMenuItems: MenuItem[] = [
  {
    icon: "ri-speed-up-line",
    label: "Tableau de bord",
    url: "/",
  },
  {
    icon: "fr-icon-community-line",
    label: "Structures d’hébergement",
    url: "/structures",
    subItems: [
      {
        label: "Voir les structures",
        url: "/structures",
      },
      {
        label: "Voir les CPOM",
        url: "/cpoms",
      },
    ],
  },
  {
    icon: "fr-icon-user-setting-line",
    label: "Opérateurs",
    url: "/operateurs",
  },
  {
    icon: "fr-icon-pie-chart-2-line",
    label: "Statistiques",
    url: "/statistiques",
  },
  ...(process.env.NEXT_PUBLIC_SHOW_RESSOURCES === "true" //TODO: remove this once the ressources page is ready
    ? [
        {
          icon: "fr-icon-book-shelf-line",
          label: "Modèles et ressources",
          url: "/ressources",
        },
      ]
    : []),
];

// TODO : ajouter les autres élements dans de prochaines PR
const getOperateurMenuItems = (operateurId: number | null): MenuItem[] => [
  {
    icon: "fr-icon-user-setting-line",
    label: "Opérateur",
    url: `/operateurs/${operateurId}`,
  },
];

export const resolveMenuItems = (user: SessionUser) => {
  if (isOperateurUser(user)) {
    return getOperateurMenuItems(user?.operateurId);
  }
  return agentMenuItems;
};

type MenuItem = {
  icon: string;
  label: string;
  url: string;
  subItems?: { label: string; url: string }[];
};
