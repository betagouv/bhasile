import { canAccessPage, COCKPIT_ADMIN_PAGE } from "@/lib/casl/pages";
import { SessionUser } from "@/types/global";
import { ReadableEntitiesSample } from "@/types/readable-ids.type";

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

export const resolveMenuItems = (
  user?: SessionUser | null,
  readableEntities?: ReadableEntitiesSample
): MenuItem[] => {
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
            getStructuresSubItem(readableEntities?.structureIds),
            ...getCpomsSubItems(readableEntities?.cpomIds),
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
    ...getParametresGroup(canAccess),
  ];
};

const getSingleId = (ids: number[] | undefined): number | null =>
  ids?.length === 1 ? ids[0] : null;

const getStructuresSubItem = (
  structureIds: number[] | undefined
): MenuSubItem => {
  const singleStructureId = getSingleId(structureIds);
  return singleStructureId === null
    ? { label: "Voir les structures", url: "/structures" }
    : { label: "Voir la structure", url: `/structures/${singleStructureId}` };
};

const getCpomsSubItems = (cpomIds: number[] | undefined): MenuSubItem[] => {
  if (cpomIds?.length === 0) {
    return [];
  }
  const singleCpomId = getSingleId(cpomIds);
  return singleCpomId === null
    ? [{ label: "Voir les CPOM", url: "/cpoms" }]
    : [{ label: "Voir le CPOM", url: `/cpoms/${singleCpomId}` }];
};

const getParametresGroup = (
  canAccess: (url: string) => boolean
): MenuGroup[] => {
  const subItems = [
    ...(process.env.NEXT_PUBLIC_SHOW_PARAMETRES === "true" //TODO: remove this once the parametres pages are ready
      ? [
          { label: "Gérer les accès", url: "/parametres/acces" },
          { label: "Voir mon compte", url: "/parametres/compte" },
        ]
      : []),
    ...(canAccess(COCKPIT_ADMIN_PAGE)
      ? [{ label: "Cockpit admin", url: COCKPIT_ADMIN_PAGE }]
      : []),
  ];
  return subItems.length > 0
    ? [
        {
          id: "parametres",
          icon: "fr-icon-settings-5-line",
          label: "Paramètres",
          subItems,
        },
      ]
    : [];
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
