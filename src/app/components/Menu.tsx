"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { Logo } from "./Logo";
import { MenuFooter } from "./MenuFooter";

export const Menu = (): ReactElement => {
  const pathname = usePathname();

  const menuItems = [
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
  ];

  const isMenuItemActive = (
    url: string,
    subItems?: { url: string }[]
  ): boolean => {
    const matchesPath = (candidate: string): boolean =>
      candidate === "/"
        ? pathname === "/"
        : Boolean(pathname?.includes(candidate));
    return (
      matchesPath(url) ||
      Boolean(subItems?.some((subItem) => matchesPath(subItem.url)))
    );
  };

  const getActiveClass = (
    url: string,
    subItems?: { url: string }[]
  ): string => {
    return isMenuItemActive(url, subItems) ? "fr-sidemenu__item--active" : "";
  };

  const getAriaCurrent = (
    url: string,
    subItems?: { url: string }[]
  ): "page" | boolean => {
    return isMenuItemActive(url, subItems) ? "page" : false;
  };

  return (
    <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey shrink-0">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>

      <ul className="fr-sidemenu__list p-4">
        {menuItems.map((menuItem) => (
          <li
            className={`fr-sidemenu__item before:content-none ${getActiveClass(menuItem.url, menuItem.subItems)}`}
            key={menuItem.label}
          >
            <Link
              className="fr-sidemenu__link before:content-none"
              href={menuItem.url}
              aria-current={getAriaCurrent(menuItem.url, menuItem.subItems)}
            >
              <div className={`${menuItem.icon} pr-2`} />
              <div>{menuItem.label}</div>
            </Link>
            {menuItem.subItems && (
              <ul className="fr-sidemenu__list">
                {menuItem.subItems.map((subItem) => (
                  <li
                    className={`fr-sidemenu__item ${getActiveClass(subItem.url)}`}
                    key={subItem.label}
                  >
                    <Link
                      className="fr-sidemenu__link"
                      href={subItem.url}
                      aria-current={getAriaCurrent(subItem.url)}
                    >
                      {subItem.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <MenuFooter />
    </nav>
  );
};
