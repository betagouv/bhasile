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
      label: "Aide",
      url: `mailto:${BHASILE_CONTACT_EMAIL}`,
      isExternalLink: true,
    },
    {
      label: "Politique de confidentialité",
      url: "/confidentialite",
    },
    {
      label: "Accessibilité : partiellement conforme",
      url: "/accessibilite",
    },
    {
      label: "Usage",
      url: "/usage",
    },
    {
      label: "Code source",
      url: "https://github.com/betagouv/bhasile",
      isExternalLink: true,
    },
  ];

  const getActiveClass = (url: string): string => {
    return pathname?.includes(url) ? "fr-sidemenu__item--active" : "";
  };

  const getAriaCurrent = (url: string): "page" | boolean => {
    return pathname?.includes(url) ? "page" : false;
  };

  return (
    <nav className="fr-sidemenu pb-6 pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey ">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>

      <ul className="fr-sidemenu__list p-4">
        {menuItems.map((menuItem) => (
          <li
            className={`fr-sidemenu__item ${getActiveClass(menuItem.url)}`}
            key={menuItem.label}
          >
            <Link
              className="fr-sidemenu__link"
              href={menuItem.url}
              aria-current={getAriaCurrent(menuItem.url)}
            >
              <span className={menuItem.icon}>{menuItem.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-4 mt-auto">
        <User />
      </div>
      <ul className="p-4">
        {secondaryMenuItems.map((menuItem) => (
          <li className="text-mention-grey fr-text--xs" key={menuItem.label}>
            {menuItem.isExternalLink ? (
              <ExternalLink title={menuItem.label} url={menuItem.url} />
            ) : (
              <Link href={menuItem.url}>
                <span>{menuItem.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
