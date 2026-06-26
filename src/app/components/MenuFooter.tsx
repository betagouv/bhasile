import Link from "next/link";
import { ReactElement } from "react";

import { BHASILE_CONTACT_EMAIL } from "@/constants";

import { ExternalLink } from "./common/ExternalLink";
import { User } from "./User";

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

export const MenuFooter = (): ReactElement => {
  return (
    <div className="mt-auto">
      <div className="p-6 border-b border-b-border-default-grey border-t border-t-border-default-grey">
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
    </div>
  );
};
