import Link from "next/link";
import { ReactElement } from "react";

export const NavigationMenu = ({ menuElements }: Props): ReactElement => {
  return (
    <nav className="fr-nav border-b border-b-border-default-grey">
      <ul className="fr-nav__list">
        {menuElements
          .filter((menuElement) => menuElement.isDisplayed)
          .map((menuElement) => (
            <li key={menuElement.label} className="fr-nav__item">
              <Link
                className="fr-nav__link text-title-blue-france font-bold px-6 py-4 text-base"
                href={menuElement.section}
              >
                {menuElement.label}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
};

type Props = {
  menuElements: {
    label: string;
    section: string;
    isDisplayed: boolean;
  }[];
};
