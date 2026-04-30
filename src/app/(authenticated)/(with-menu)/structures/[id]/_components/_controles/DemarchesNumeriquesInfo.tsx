import Link from "next/link";
import { ReactElement } from "react";

export const DemarchesNumeriquesInfo = (): ReactElement => {
  return (
    <span className="italic block border-b border-default-grey text-mention-grey py-2 px-4 text-xs">
      Actuellement, seuls les EIG renseignés sur Démarches Numériques sont
      affichés, l’ancienneté de cet historique dépend donc de la date à laquelle
      votre région a été articulée avec l’outil. Pour connaître le détail d’un
      EIG, consultez le sur{" "}
      <Link
        href="https://demarche.numerique.gouv.fr/"
        target="_blank"
        rel="noopener external"
        title="Démarches numériques"
      >
        <span className="underline">Démarches numériques</span>
      </Link>{" "}
      avec le numéro de dossier correspondant.
    </span>
  );
};
