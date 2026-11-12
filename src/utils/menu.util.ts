import { canAccessPage } from "@/lib/casl/pages";
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

export const resolveMenuItems = (user?: SessionUser | null): MenuItem[] => {
  const canAccess = (url: string): boolean =>
    canAccessPage(user ?? undefined, url);
  const canSeeOperateurs = canAccess("/operateurs");

  return [
    ...filterAccessibleItems(
      [
        {
          icon: "ri-speed-up-line",
          label: "Tableau de bord",
          url: "/",
        },
        {
          id: "structures",
          icon: "fr-icon-community-line",
          label: canSeeOperateurs
            ? "Structures et opérateurs"
            : "Structures et opérateur",
          subItems: [
            { label: "Voir les structures", url: "/structures" },
            { label: "Voir les CPOM", url: "/cpoms" },
            canSeeOperateurs
              ? { label: "Voir les opérateurs", url: "/operateurs" }
              : {
                  label: "Voir l’opérateur",
                  url: `/operateurs/${user?.operateurId}`,
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
      ],
      canAccess
    ),
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
};

const filterAccessibleItems = (
  items: MenuItem[],
  canAccess: (url: string) => boolean
): MenuItem[] =>
  items.flatMap((item): MenuItem[] => {
    if (!("subItems" in item)) {
      return canAccess(item.url) ? [item] : [];
    }
    const subItems = item.subItems.filter((subItem) => canAccess(subItem.url));
    return subItems.length > 0 ? [{ ...item, subItems }] : [];
  });
