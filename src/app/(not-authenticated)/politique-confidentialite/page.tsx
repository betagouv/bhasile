import Link from "next/link";
import { ReactElement } from "react";

export default function PolitiqueConfidentialite(): ReactElement {
  return (
    <article>
      <h1 className="text-title-blue-france">
        Politique de confidentialité du service BHASILE
      </h1>

      <section>
        <h2 className="text-title-blue-france">1. Responsable du traitement</h2>
        <p>
          Le responsable de traitement des données à caractère personnel est
          madame Elise ADEVAH-POEUF, en sa qualité de directrice de l’asile de
          la Direction des étrangers en France du Ministère de l’Intérieur.
          (email :{" "}
          <Link
            className="text-title-blue-france"
            href="mailto:bhasile-da-dgef@interieur.gouv.fr"
          >
            bhasile-da-dge​f@interieur.gouv.fr
          </Link>
          )
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">2. Finalités du traitement</h2>
        <p>
          Le service BHASILE permet de piloter et réaliser le suivi du parc
          d’hébergement des demandeurs d’asile, de centraliser et mettre à
          disposition des données administratives nécessaires à l’exercice des
          missions des administrations compétentes.
        </p>
        <p>
          Ainsi, BHASILE traite des données à caractère personnel pour les
          finalités suivantes :
        </p>
        <ul>
          <li>Gérer la connexion des utilisateurs au service ;</li>
          <li>Assurer la traçabilité des actions réalisées sur le service.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          3. Base juridique du traitement
        </h2>
        <ul>
          <li>
            La base légale est : l’exécution d’une mission d’intérêt public ou
            relevant de l’exercice de l’autorité publique dont est investi la
            Direction de l’Asile du Ministère de l’Intérieur, au sens de
            l’article 6, paragraphe 1, point e) du RGPD.
          </li>
          <li>
            Cette mission d’intérêt public se traduit en pratique par
            l’article&nbsp;
            <Link
              className="text-title-blue-france"
              href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000050505712"
            >
              8 du décret n° 2013-728 du 12 août 2013
            </Link>{" "}
            portant organisation de l’administration centrale du ministère de
            l’intérieur et du ministère des outre-mer.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-title-blue-france">4. Données traitées</h2>
        <p>
          Les données à caractère personnel traitées dans le cadre du service
          BHASILE sont les suivantes :
        </p>
        <ul>
          <li>
            Données d’identification et de contact professionnel des personnels
            des opérateurs (nom, prénom, intitulé du poste, adresse électronique
            professionnelle, numéro de téléphone professionnel) ;
          </li>
          <li>
            Données d’authentification via le dispositif ProConnect (identité
            professionnelle, adresse électronique professionnelle) ;
          </li>
          <li>
            Données techniques nécessaires au fonctionnement et à la sécurité du
            service (logs et adresse IP) ;
          </li>
        </ul>
        <p>
          Le service BHASILE n’a pas vocation à traiter des données à caractère
          personnel relatives aux demandeurs d’asile.
        </p>
        <p>
          Les données renseignées dans l’outil (noms, prénoms, adresse courriel
          et numéro de téléphone des agents publics) sont diffusées en Open Data
          (annuaires, organigrammes).
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">5. Source des données</h2>
        <p>Les données sont collectées :</p>
        <ul>
          <li>Directement auprès des utilisateurs du service ;</li>
          <li>
            Indirectement via les réponses à des questionnaires adressés à des
            opérateurs, dont les réponses sont intégrées à la base de données du
            service ;
          </li>
          <li>
            Par importation de données réalisée par les utilisateurs autorisés.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          6. Destinataires des données et sous-traitants
        </h2>
        <p>Les données traitées sont destinées exclusivement :</p>
        <ul>
          <li>
            Aux agents habilités du Ministère de l’Intérieur et des services
            déconcentrés compétents (Direction de l’Asile, DREETS, SGAR, DRIHL,
            DDETS, DDETSPP, UD-DRIHL) ;
          </li>
          <li>
            Aux personnels habilités chargés de l’administration et de la
            maintenance du service.
          </li>
        </ul>
        <p>
          Les données ne font l’objet d’aucune communication à des tiers non
          autorisés.
        </p>
        <p>
          Les données peuvent également être accessibles aux prestataires
          techniques agissant en qualité de sous-traitants, notamment :
        </p>
        <ul>
          <li>Les hébergeurs : OVH et Scalingo.</li>
        </ul>
        <p>Leurs contrats de sous-traitance sont disponibles ici :</p>
        <ul>
          <li>
            OVH :{" "}
            <Link
              className="text-title-blue-france"
              href="https://us.ovhcloud.com/legal/data-processing-agreement/"
            >
              https://us.ovhcloud.com/legal/data-processing-agreement/
            </Link>
          </li>
          <li>
            Scalingo :{" "}
            <Link
              className="text-title-blue-france"
              href="https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles"
            >
              https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-title-blue-france">7. Durée de conservation</h2>
        <p>
          Les données à caractère personnel sont conservées pendant deux ans à
          partir du dernier contact avec l’utilisateur.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          8. Cookies et mesure d’audience
        </h2>
        <p>
          Le service BHASILE utilise l’outil de mesure d’audience{" "}
          <strong>Matomo</strong>, configuré de manière à respecter la
          réglementation applicable et les recommandations de la CNIL. Son mode
          « exempté » permet de ne pas recueillir le consentement des
          utilisateurs via un bandeau cookies.
        </p>
        <p>
          Les données collectées via Matomo ont pour seule finalité la mesure de
          l’audience et l’amélioration du service.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          9. Droits des personnes concernées
        </h2>
        <p>
          Conformément au RGPD, les personnes concernées disposent des droits
          suivants :
        </p>
        <ul>
          <li>Droit d’accès et d’information ;</li>
          <li>Droit de rectification ;</li>
          <li>Droit à la limitation du traitement ;</li>
          <li>
            Droit d’opposition, pour des raisons tenant à leur situation
            particulière.
          </li>
        </ul>
        <p>
          Ces droits peuvent être exercés auprès du DPO du Ministère de
          l’Intérieur :
        </p>
        <ul>
          <li>
            Par courrier :
            <br />
            Ministère de l’Intérieur
            <br />
            À l’attention du délégué à la protection des données (DPO)
            <br />
            Place Beauvau
            <br />
            75800 Paris CEDEX 08
          </li>
          <li>
            Par courriel :{" "}
            <Link
              className="text-title-blue-france"
              href="mailto:delegue-protection-donnees@interieur.gouv.fr"
            >
              delegue-protection-donnees@interieur.gouv.fr
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-title-blue-france">10. Réclamation</h2>
        <p>
          Les personnes concernées peuvent introduire une réclamation auprès de
          la Commission nationale de l’informatique et des libertés (CNIL) si
          elles estiment, après avoir contacté le responsable de traitement ou
          le DPO, que leurs droits ne sont pas respectés.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          11. Évolution de la politique de confidentialité
        </h2>
        <p>
          La présente politique de confidentialité peut être modifiée à tout
          moment afin de tenir compte des évolutions législatives,
          réglementaires ou techniques. Les utilisateurs sont invités à la
          consulter régulièrement.
        </p>
      </section>
    </article>
  );
}
