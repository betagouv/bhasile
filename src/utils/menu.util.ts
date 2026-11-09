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

export const resolveMenuItems = (user?: SessionUser | null): MenuItem[] =>
  buildMenuItems({
    isAgent: Boolean(user && isAgent(user)),
    operateurId: user?.operateurId ?? null,
  });

const buildMenuItems = ({
  isAgent,
  operateurId,
}: {
  isAgent: boolean;
  operateurId: number | null;
}): MenuItem[] => [
  // TODO : remettre le tableau de bord, les cpoms et les stats pour les opérateurs dans une future PR
  ...(isAgent
    ? [
        {
          icon: "ri-speed-up-line",
          label: "Tableau de bord",
          url: "/",
        } satisfies MenuLink,
      ]
    : []),
  {
    id: "structures",
    icon: "fr-icon-community-line",
    label: isAgent ? "Structures et opérateurs" : "Structures et opérateur",
    subItems: [
      {
        label: "Voir les structures",
        url: "/structures",
      },
      ...(isAgent
        ? [
            {
              label: "Voir les CPOM",
              url: "/cpoms",
            },
          ]
        : []),
      ...(isAgent
        ? [
            {
              label: "Voir les opérateurs",
              url: "/operateurs",
            },
          ]
        : operateurId
          ? [
              {
                label: "Voir l’opérateur",
                url: `/operateurs/${operateurId}`,
              },
            ]
          : []),
    ],
  },
  ...(isAgent
    ? [
        {
          icon: "fr-icon-pie-chart-2-line",
          label: "Statistiques",
          url: "/statistiques",
        } satisfies MenuLink,
      ]
    : []),
  ...(isAgent && process.env.NEXT_PUBLIC_SHOW_RESSOURCES === "true" //TODO: remove this once the ressources page is ready
    ? [
        {
          icon: "fr-icon-book-shelf-line",
          label: "Modèles et ressources",
          url: "/ressources",
        } satisfies MenuLink,
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
        } satisfies MenuGroup,
      ]
    : []),
];
