import Link from "next/link";
import { ReactElement } from "react";

export default function WithMenuNotFound(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full py-16 text-center">
      <span
        className="fr-icon-search-line text-mention-grey"
        aria-hidden="true"
      />
      <p className="text-lg font-bold text-title-blue-france mb-0">
        Cette page n’existe pas.
      </p>
      <p className="text-sm text-mention-grey mb-0">
        L’adresse est peut-être erronée, ou la donnée a été supprimée.
      </p>
      <Link className="fr-btn fr-btn--secondary" href="/">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
