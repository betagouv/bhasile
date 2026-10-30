"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { SessionUser } from "@/types/global";
import {
  MenuGroup,
  MenuGroupId,
  MenuItem,
  resolveMenuItems,
} from "@/utils/menu.util";

import { Logo } from "./Logo";
import { MenuFooter } from "./MenuFooter";

const matchesPath = (pathname: string | null, url: string): boolean =>
  url === "/" ? pathname === "/" : Boolean(pathname?.includes(url));

const findActiveGroupId = (
  menuItems: MenuItem[],
  pathname: string | null
): MenuGroupId | null => {
  const activeGroup = menuItems.find(
    (menuItem): menuItem is MenuGroup =>
      "subItems" in menuItem &&
      menuItem.subItems.some((subItem) => matchesPath(pathname, subItem.url))
  );
  return activeGroup?.id ?? null;
};

export const Menu = (): ReactElement | null => {
  const pathname = usePathname();
  const { data: sessionData, status } = useSession();

  const menuItems = useMemo(() => {
    if (status === "loading") {
      return [];
    }
    return resolveMenuItems(sessionData?.user as SessionUser);
  }, [status, sessionData?.user]);

  const [openGroup, setOpenGroup] = useState<MenuGroupId | null>(() =>
    findActiveGroupId(menuItems, pathname)
  );

  const toggleGroup = (groupId: MenuGroupId): void => {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  };

  useEffect(() => {
    const activeGroupId = findActiveGroupId(menuItems, pathname);
    if (activeGroupId) {
      setOpenGroup(activeGroupId);
    }
  }, [menuItems, pathname]);

  const isMenuItemActive = (menuItem: MenuItem): boolean =>
    "subItems" in menuItem
      ? menuItem.subItems.some((subItem) => matchesPath(pathname, subItem.url))
      : matchesPath(pathname, menuItem.url);

  if (status === "loading") {
    return (
      <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey shrink-0">
        <div className="border-b border-default-grey min-h-[4.35rem] grid">
          <Logo />
        </div>
        <MenuFooter />
      </nav>
    );
  }

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
                        className={`fr-sidemenu__item ${matchesPath(pathname, subItem.url) ? "fr-sidemenu__item--active" : ""}`}
                        key={subItem.label}
                      >
                        <Link
                          className="fr-sidemenu__link"
                          href={subItem.url}
                          aria-current={
                            matchesPath(pathname, subItem.url) ? "page" : false
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
                href={menuItem.url}
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
