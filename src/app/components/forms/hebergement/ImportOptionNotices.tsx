import Link from "next/link";

import { MODELE_DIFFUS_LINK, MODELE_MIXTE_LINK } from "@/constants";
import { Repartition } from "@/types/adresse.type";

import { AdressImporter } from "./AdressImporter";

export const ImportOptionNotices = ({ typeBati }: Props) => {
  const modelLink =
    typeBati === Repartition.DIFFUS ? MODELE_DIFFUS_LINK : MODELE_MIXTE_LINK;

  return (
    <div className="rounded-lg bg-default-grey-hover p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-lg text-title-blue-france mb-0">
          Option 1 - Remplissage semi-automatique
        </h3>
        <p className="text-sm text-mention-grey mb-0">
          (recommandé si plus de 12 adresses à saisir)
        </p>
      </div>
      <p className="mb-0">
        Veuillez télécharger le modèle et le compléter depuis un logiciel
        tableur. Une fois enregistré, vous pourrez l&apos;importer puis vérifier
        le remplissage qui s&apos;opérera automatiquement dans les champs
        ci-dessous.
      </p>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-title-blue-france mb-0">
          1 Téléchargez le modèle
        </p>
        <Link href={modelLink} className="underline text-title-blue-france">
          Modèle adresses hébergement{" "}
          <i className="fr-icon-contract-right-line"></i>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-title-blue-france mb-0">
          2 Téléversez le fichier rempli
        </p>
        <p className="text-disabled-grey mb-0 text-xs">
          Taille maximale : 10 Mo. Formats supportés : xls, xlsx, et csv.
        </p>
        <AdressImporter typeBati={typeBati} />
      </div>
    </div>
  );
};

type Props = {
  typeBati: Repartition;
};
