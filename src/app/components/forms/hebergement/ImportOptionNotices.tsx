import Link from "next/link";

import { MODELE_DIFFUS_LINK, MODELE_MIXTE_LINK } from "@/constants";
import { Repartition } from "@/types/adresse.type";

import { AdressImporter } from "./AdressImporter";

export const ImportOptionNotices = ({ typeBati }: Props) => {
  const modelLink =
    typeBati === Repartition.DIFFUS ? MODELE_DIFFUS_LINK : MODELE_MIXTE_LINK;

  return (
    <div className="rounded-lg bg-default-grey-hover p-6 flex flex-col gap-8">
      <div>
        <h3 className="text-lg text-title-blue-france mb-0">
          Option 1 - Remplissage semi-automatique
        </h3>
        <p className="text-sm text-title-blue-france mb-4">
          (recommandé si plus de 20 adresses à saisir)
        </p>
        <p className="mb-0">
          Veuillez télécharger le modèle et le compléter depuis un logiciel
          tableur. Une fois enregistré, vous pourrez l&apos;importer puis
          vérifier le remplissage qui s&apos;opérera automatiquement dans les
          champs ci-dessous.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-title-blue-france mb-0 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-active-blue-france text-white font-medium">
            1
          </span>
          Téléchargez le modèle
        </p>
        <Link href={modelLink} className="underline text-title-blue-france">
          Modèle adresses hébergement
        </Link>
        <p className="text-disabled-grey mb-0 text-xs">XLS - 11,9 Ko</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-title-blue-france mb-0 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-active-blue-france text-white font-medium">
            2
          </span>
          Téléversez le fichier rempli
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
