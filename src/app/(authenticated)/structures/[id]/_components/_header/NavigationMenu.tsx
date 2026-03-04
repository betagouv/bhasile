import Link from "next/link";
import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";

export const NavigationMenu = (): ReactElement => {
  const { structure } = useStructureContext();

  const menuElements: MenuElement[] = [
    { label: "Description", section: "#description", isDisplayed: true },
    { label: "Calendrier", section: "#calendrier", isDisplayed: true },
    { label: "Type de places", section: "#places", isDisplayed: true },
    {
      label: "Finances",
      section: "#finances",
      isDisplayed: !!structure.budgets && structure.budgets?.length > 0,
    },
    {
      label: "Contrôle qualité",
      section: "#controle",
      isDisplayed: true,
    },
    { label: "Activité", section: "#activite", isDisplayed: false },
    {
      label: "Actes administratifs",
      section: "#actes-administratifs",
      isDisplayed: true,
    },
    { label: "Notes", section: "#notes", isDisplayed: true },
  ];

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

type MenuElement = {
  label: string;
  section: string;
  isDisplayed: boolean;
};
