import Link from "next/link";
import { ReactElement } from "react";

export const DemarcheNumeriqueInfo = (): ReactElement => {
  return (
    <span className="italic block border-b border-default-grey text-mention-grey py-2 px-4 text-xs">
      Actuellement, seuls les EIG renseignés sur Démarche Numérique sont
      affichés, l’ancienneté de cet historique dépend donc de la date à laquelle
      votre région a été articulée avec l’outil. Pour connaître le détail d’un
      EIG, consultez le sur{" "}
      <Link
        href="https://demarche.numerique.gouv.fr/"
        target="_blank"
        rel="noopener external"
        title="Démarche Numérique"
      >
        <span className="underline">Démarche Numérique</span>
      </Link>{" "}
      avec le numéro de dossier correspondant.
    </span>
  );
};
