import { CustomNotice } from "../../common/CustomNotice";

export const ManualOptionNotices = () => {
  return (
    <div className="flex flex-col gap-4">
      <CustomNotice
        severity="info"
        className="!mb-0"
        title="Pour le champ “places”,"
        description="veuillez renseigner le nombre total de places autorisées pour l’adresse correspondante."
      />
      <CustomNotice
        severity="info"
        className="!mb-0"
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
    </div>
  );
};
