import Notice from "@codegouvfr/react-dsfr/Notice";
import Link from "next/link";

import { AdressImporter } from "@/app/components/forms/address/AdressImporter";
import { MODELE_DIFFUS_LINK, MODELE_MIXTE_LINK } from "@/constants";
import { Repartition } from "@/types/adresse.type";

export const Notices = ({ typeBati, hebergementsContainerRef }: Props) => {
  return (
    <>
      <div className="flex flex-col gap-2" ref={hebergementsContainerRef}>
        {typeBati === Repartition.COLLECTIF ? (
          <p className="mb-6">
            Veuillez renseigner l’ensemble des adresses d’hébergement de la
            structure.
          </p>
        ) : (
          <>
            <p className="mb-1">
              Veuillez renseigner l’ensemble des adresses d’hébergement de la
              structure. <br />
              Vous pouvez le faire directement en remplissant les champs
              ci-dessous ou vous pouvez compléter{" "}
              <Link
                href={
                  typeBati === Repartition.DIFFUS
                    ? MODELE_DIFFUS_LINK
                    : MODELE_MIXTE_LINK
                }
                className="underline text-title-blue-france"
              >
                notre modèle à télécharger
              </Link>{" "}
              depuis un logiciel tableur, l’importer puis vérifier le
              remplissage automatique des champs qui s’opérera.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-action-high-blue-france font-bold mb-0">
                Liste des hébergements (d’après notre modèle à télécharger
                uniquement)
              </p>
              <p className="text-disabled-grey mb-0 text-xs col-span-3">
                Taille maximale par fichier : 10 Mo. Formats supportés : xls,
                xlsx, et csv.
              </p>
              <AdressImporter typeBati={typeBati} />
            </div>
          </>
        )}
      </div>
      <Notice
        severity="info"
        title="Pour le champ “places”,"
        description="veuillez renseigner le nombre total de places autorisées pour l’adresse correspondante."
      />
      <Notice
        severity="info"
        title=""
        description={
          <>
            Concernant les particularités, les logements sociaux correspondent
            aux logement loués à un bailleur social. Vous pouvez vérifier si une
            adresse est dans un Quartier Prioritaire de la politique de la Ville
            (QPV){" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://sig.ville.gouv.fr/"
              className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2"
            >
              sur ce lien
            </a>
            . Si une adresse ne donne pas de résultat, veuillez laisser la case
            décochée.
          </>
        }
      />
    </>
  );
};

type Props = {
  typeBati: Repartition;
  hebergementsContainerRef: React.RefObject<null>;
};
