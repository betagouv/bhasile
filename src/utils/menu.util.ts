import { isAgent } from "@/lib/casl/rules";
import { SessionUser } from "@/types/global";

export type MenuGroupId = "structures" | "parametres";

export type MenuSubItem = {
  label: string;
  url: string;
};

export type MenuLink = {
  icon: string;
  label: string;
  url: string;
};

export type MenuGroup = {
  id: MenuGroupId;
  icon: string;
  label: string;
  subItems: MenuSubItem[];
};

export type MenuItem = MenuLink | MenuGroup;

const agentMenuItems: MenuItem[] = [
  {
    icon: "ri-speed-up-line",
    label: "Tableau de bord",
    url: "/",
  },
  {
    id: "structures",
    icon: "fr-icon-community-line",
    label: "Structures et opérateurs",
    subItems: [
      {
        label: "Voir les structures",
        url: "/structures",
      },
      {
        label: "Voir les CPOM",
        url: "/cpoms",
      },
      {
        label: "Voir les opérateurs",
        url: "/operateurs",
      },
    ],
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
  ...(process.env.NEXT_PUBLIC_SHOW_PARAMETRES === "true" //TODO: remove this once the parametres pages are ready
    ? [
        {
          id: "parametres" as const,
          icon: "fr-icon-settings-5-line",
          label: "Paramètres",
          subItems: [
            {
              label: "Gérer les accès",
              url: "/parametres/acces",
            },
            {
              label: "Voir mon compte",
              url: "/parametres/compte",
            },
          ],
        },
      ]
    : []),
];

const getOperateurMenuItems = (operateurId: number | null): MenuItem[] => [
  {
    icon: "ri-speed-up-line",
    label: "Tableau de bord",
    url: "/",
  },
  {
    id: "structures",
    icon: "fr-icon-community-line",
    label: "Structures et opérateur",
    subItems: [
      {
        label: "Voir les structures",
        url: "/structures",
      },
      {
        label: "Voir les CPOM",
        url: "/cpoms",
      },
      {
        label: "Voir l’opérateur",
        url: `/operateurs/${operateurId}`,
      },
    ],
  },
  ...(process.env.NEXT_PUBLIC_SHOW_PARAMETRES === "true" //TODO: remove this once the parametres pages are ready
    ? [
        {
          id: "parametres" as const,
          icon: "fr-icon-settings-5-line",
          label: "Paramètres",
          subItems: [
            {
              label: "Gérer les accès",
              url: "/parametres/acces",
            },
            {
              label: "Voir mon compte",
              url: "/parametres/compte",
            },
          ],
        },
      ]
    : []),
];

export const resolveMenuItems = (user?: SessionUser | null): MenuItem[] => {
  if (!user || isAgent(user)) {
    return agentMenuItems;
  }
  return getOperateurMenuItems(user.operateurId ?? null);
};
