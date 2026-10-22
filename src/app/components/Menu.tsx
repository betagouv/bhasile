"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactElement, Suspense, useState } from "react";

import {
  pickGlobalFilters,
  withGlobalFilters,
} from "@/utils/global-filters.util";

import { Logo } from "./Logo";
import { MenuFooter } from "./MenuFooter";

export const Menu = (): ReactElement => (
  <Suspense fallback={<MenuContent globalFilters={new URLSearchParams()} />}>
    <MenuWithGlobalFilters />
  </Suspense>
);

const MenuWithGlobalFilters = (): ReactElement => (
  <MenuContent globalFilters={pickGlobalFilters(useSearchParams())} />
);

const MenuContent = ({ globalFilters }: Props): ReactElement => {
  const pathname = usePathname();

  const [openGroup, setOpenGroup] = useState<MenuGroupId>(
    getDefaultOpenGroup(pathname)
  );
  const [previousPathname, setPreviousPathname] = useState(pathname);
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setOpenGroup(getDefaultOpenGroup(pathname));
  }

  const toggleGroup = (groupId: MenuGroupId): void => {
    setOpenGroup(openGroup === groupId ? "structures" : groupId);
  };

  const menuItems: MenuItem[] = [
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

  const matchesPath = (url: string): boolean =>
    url === "/" ? pathname === "/" : Boolean(pathname?.includes(url));

  const isMenuItemActive = (menuItem: MenuItem): boolean =>
    "subItems" in menuItem
      ? menuItem.subItems.some((subItem) => matchesPath(subItem.url))
      : matchesPath(menuItem.url);

  return (
    <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey shrink-0">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>

      <ul className="fr-sidemenu__list p-4">
        {menuItems.map((menuItem) => (
          <li
            className={`fr-sidemenu__item before:content-none ${isMenuItemActive(menuItem) ? "fr-sidemenu__item--active" : ""}`}
            key={menuItem.label}
          >
            {"subItems" in menuItem ? (
              <>
                <button
                  type="button"
                  className={`fr-sidemenu__btn before:content-none aria-expanded:bg-transparent ${isMenuItemActive(menuItem) ? "text-active-blue-france font-bold" : ""}`}
                  aria-expanded={openGroup === menuItem.id}
                  onClick={() => toggleGroup(menuItem.id)}
                >
                  <div className={`${menuItem.icon} pr-2`} />
                  <div>{menuItem.label}</div>
                </button>
                {openGroup === menuItem.id && (
                  <ul className="fr-sidemenu__list">
                    {menuItem.subItems.map((subItem) => (
                      <li
                        className={`fr-sidemenu__item ${matchesPath(subItem.url) ? "fr-sidemenu__item--active" : ""}`}
                        key={subItem.label}
                      >
                        <Link
                          className="fr-sidemenu__link"
                          href={withGlobalFilters(subItem.url, globalFilters)}
                          aria-current={
                            matchesPath(subItem.url) ? "page" : false
                          }
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link
                className="fr-sidemenu__link before:content-none"
                href={withGlobalFilters(menuItem.url, globalFilters)}
                aria-current={isMenuItemActive(menuItem) ? "page" : false}
              >
                <div className={`${menuItem.icon} pr-2`} />
                <div>{menuItem.label}</div>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <MenuFooter />
    </nav>
  );
};

const getDefaultOpenGroup = (pathname: string | null): MenuGroupId =>
  pathname?.startsWith("/parametres") ? "parametres" : "structures";

type MenuGroupId = "structures" | "parametres";

type MenuSubItem = {
  label: string;
  url: string;
};

type MenuItem =
  | {
      icon: string;
      label: string;
      url: string;
    }
  | {
      id: MenuGroupId;
      icon: string;
      label: string;
      subItems: MenuSubItem[];
    };

type Props = {
  globalFilters: URLSearchParams;
};
