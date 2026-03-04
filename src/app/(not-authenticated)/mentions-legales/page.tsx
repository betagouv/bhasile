import Link from "next/link";
import { ReactElement } from "react";

export default function MentionsLegales(): ReactElement {
  return (
    <article>
      <h1 className="text-title-blue-france">Mentions légales - BHASILE</h1>

      <section>
        <h2 className="text-title-blue-france">Éditeur du site</h2>
        <p>
          Le site <strong>BHASILE</strong> est édité par :
        </p>
        <p>
          La Direction de l’Asile de la Direction générale des étrangers en
          France
        </p>
        <p>du Ministère de l’Intérieur</p>
        <p>Immeuble Le Garance 18-20 rue des Pyrénées</p>
        <p>75020 Paris</p>
        <p>France</p>
        <p>Téléphone : 01 77 72 61 00</p>
      </section>

      <section>
        <h2 className="text-title-blue-france">Directeur de la publication</h2>
        <p>
          La directrice de la publication est madame Elise ADEVAH-POEUF, en sa
          qualité de directrice de l’asile (Email :{" "}
          <Link
            className="fr-btn--tertiary-no-outline"
            href="mailto:bhasile-da-dgef@intereieur.gouv.fr"
          >
            bhasile-da-dge​f@intereieur.gouv.fr
          </Link>
          )
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">Hébergement</h2>
        <p>Le site BHASILE est hébergé par :</p>
        <p>
          <strong>Scalingo SAS</strong>
          <br />
          15 rue de la Banque
          <br />
          75002 Paris
          <br />
          France
        </p>
        <p>support@scalingo.com</p>
        <p>Et</p>
        <p>
          <strong>OVHcloud</strong>
          <br />
          2 rue Kellermann
          <br />
          59100 Roubaix
          <br />
          France
        </p>
        <p>Téléphone : 1007</p>
      </section>

      <section>
        <h2 className="text-title-blue-france">Accessibilité</h2>
        <p>
          Le site BHASILE s’inscrit dans une démarche d’amélioration continue de
          l’accessibilité numérique.
        </p>
        <p>
          À ce jour, le site est en cours d’évaluation au regard du référentiel
          général d’amélioration de l’accessibilité (RGAA). Une déclaration
          d’accessibilité sera publiée ultérieurement.
        </p>
      </section>
    </article>
  );
}
