"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { BHASILE_CONTACT_EMAIL } from "@/constants";

import { ExternalLink } from "./common/ExternalLink";
import { Logo } from "./Logo";
import { User } from "./User";

export const Menu = (): ReactElement => {
  const pathname = usePathname();

  const menuItems = [
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

  const secondaryMenuItems = [
    {
      label: "Politique de confidentialité",
      url: "/politique-confidentialite",
    },
    {
      label: "Conditions générales d'utilisation",
      url: "/cgu",
    },
    {
      label: "Mentions légales",
      url: "/mentions-legales",
    },
    {
      label: "Accessibilité : partiellement conforme",
      url: "/accessibilite",
    },
  ];

  const getActiveClass = (
    url: string,
    subItems?: { url: string }[]
  ): string => {
    const isActive =
      pathname?.includes(url) ||
      subItems?.some((subItem) => pathname?.includes(subItem.url));
    return isActive ? "fr-sidemenu__item--active" : "";
  };

  const getAriaCurrent = (
    url: string,
    subItems?: { url: string }[]
  ): "page" | boolean => {
    const isActive =
      pathname?.includes(url) ||
      subItems?.some((subItem) => pathname?.includes(subItem.url));
    return isActive ? "page" : false;
  };

  return (
    <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey shrink-0">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>

      <ul className="fr-sidemenu__list p-4">
        {menuItems.map((menuItem) => (
          <li
            className={`fr-sidemenu__item ${getActiveClass(menuItem.url, menuItem.subItems)}`}
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
      <div className="p-6 mt-auto border-b border-b-border-default-grey border-t border-t-border-default-grey">
        <User />
      </div>
      <ul className="p-6">
        {secondaryMenuItems.map((menuItem) => (
          <li className="text-mention-grey text-xs py-0.5" key={menuItem.label}>
            <Link href={menuItem.url}>
              <span>{menuItem.label}</span>
            </Link>
          </li>
        ))}
        <li className="text-mention-grey text-xs inline pr-1">
          <ExternalLink title="Aide" url={`mailto:${BHASILE_CONTACT_EMAIL}`} />
        </li>
        {" • "}
        <li className="text-mention-grey text-xs inline px-1">
          <Link href="/usage">Usage</Link>
        </li>
        {" • "}
        <li className="text-mention-grey text-xs inline pl-1">
          <ExternalLink
            title="Code source"
            url="https://github.com/betagouv/bhasile"
          />
        </li>
      </ul>
    </nav>
  );
};
