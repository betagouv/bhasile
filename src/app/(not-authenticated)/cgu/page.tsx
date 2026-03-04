import Link from "next/link";
import { ReactElement } from "react";

import { BHASILE_CONTACT_EMAIL } from "@/constants";

export default function ConditionsGeneralesUtilisation(): ReactElement {
  return (
    <article>
      <h1 className="text-title-blue-france">
        Conditions Générales d’Utilisation du service BHASILE
      </h1>

      <section>
        <h2 className="text-title-blue-france">Article 1 – Objet du service</h2>
        <p>
          Le service numérique dénommé <strong>BHASILE</strong> est un produit
          numérique développé et mis en œuvre par la Direction de l’Asile de la
          Direction générale des étrangers en France du Ministère de
          l’Intérieur. (ci-après « Éditeur »).
        </p>
        <p>
          Il a pour objet de centraliser, structurer et mettre à disposition des
          données relatives au parc d’hébergement des demandeurs d’asile, afin
          d’en faciliter le pilotage, le suivi et l’analyse par les
          administrations compétentes.
        </p>
        <p>
          Toute question relative au fonctionnement du service peut être posée à
          l’adresse suivante :{" "}
          <Link
            className="fr-btn--tertiary-no-outline"
            href={`mailto:${BHASILE_CONTACT_EMAIL}`}
          >
            {BHASILE_CONTACT_EMAIL}
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 2 – Champ d’application des CGU
        </h2>
        <p>
          Les présentes conditions générales d’utilisation (ci-après les « CGU
          ») ont pour objet de définir les modalités et conditions d’accès et
          d’utilisation du service BHASILE.
        </p>
        <p>
          Les CGU doivent être acceptées par l’utilisateur. Chaque modification
          donne lieu à une nouvelle version qui doit être acceptée.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 3 – Caractère expérimental du service
        </h2>
        <p>
          BHASILE est un produit numérique en phase expérimentale dite « bêta ».
          À ce titre, l’Éditeur se réserve le droit de faire évoluer le service
          à tout moment, notamment en modifiant, supprimant ou ajoutant des
          fonctionnalités, sans préavis.
        </p>
        <p>
          Le service peut également être temporairement indisponible pour des
          raisons techniques, de maintenance ou d’évolution.
        </p>
        <p>
          Aucune garantie n’est apportée quant à la continuité, la stabilité ou
          la disponibilité permanente du service.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">Article 4 – Accès au service</h2>

        <h3 className="text-title-blue-france">4.1 Utilisateurs autorisés</h3>
        <p>
          L’accès au service BHASILE est strictement réservé aux agents publics
          des services de l’État participant au pilotage de la politique
          d’asile, à savoir :
        </p>
        <ul>
          <li>les agents de la Direction de l’Asile (niveau national) ;</li>
          <li>
            les agents des Directions régionales de l’économie, de l’emploi, du
            travail et des solidarités (DREETS) ;
          </li>
          <li>
            les agents des secrétariats généraux pour les affaires régionales
            (SGAR) ;
          </li>
          <li>
            les agents de la Direction régionale et interdépartementale de
            l’Hébergement et du Logement (DRIHL) ;
          </li>
          <li>
            les agents des Directions départementales de l’emploi, du travail et
            des solidarités (DDETS) ;
          </li>
          <li>
            les agents des Directions départementales de l’emploi, du travail,
            des solidarités et de la protection des populations (DDETSPP) ;
          </li>
          <li>
            les agents des unités départementales de la Direction régionale et
            interdépartementale de l’Hébergement et du Logement (UD-DRIHL).
          </li>
        </ul>

        <h3 className="text-title-blue-france">
          4.2 Modalités d’authentification
        </h3>
        <p>
          L’accès au service s’effectue exclusivement par le dispositif
          d’authentification <strong>ProConnect</strong>, au moyen d’une adresse
          électronique professionnelle.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 5 – Fonctionnalités du service
        </h2>

        <h3 className="text-title-blue-france">5.1 Consultation</h3>
        <p>
          Les utilisateurs disposent d’un droit de consultation de l’ensemble
          des données accessibles sur le service, quel que soit leur échelon
          territorial.
        </p>

        <h3 className="text-title-blue-france">5.2 Modification des données</h3>
        <p>
          Les droits de modification sont déterminés en fonction de l’échelon
          territorial de l’utilisateur :
        </p>
        <ul>
          <li>
            au niveau national, les agents de la Direction de l’Asile peuvent
            intervenir sur l’ensemble du territoire ;
          </li>
          <li>
            au niveau régional, les agents des DREETS, des SGAR et de la DRIHL
            peuvent intervenir dans le périmètre de leur région ;
          </li>
          <li>
            au niveau départemental, les agents des DDETS, des DDETSPP et des
            UD-DRIHL peuvent intervenir dans le périmètre de leur département.
          </li>
        </ul>
        <p>
          Les modifications sont effectuées directement par les utilisateurs,
          sans mécanisme systématique de validation ni d’historique exhaustif
          des modifications.
        </p>
        <p>
          Les utilisateurs sont responsables de l’exactitude et de
          l’actualisation des données qu’ils saisissent ou modifient.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 6 – Importation de données
        </h2>
        <p>
          Le service permet l’importation de données, notamment par
          l’intermédiaire de fichiers de type tableur.
        </p>
        <p>
          Les utilisateurs s’assurent, préalablement à toute importation, de la
          conformité, de la qualité et de la licéité des données transmises.
          L’Éditeur n’est en aucun cas tenu responsable des importations
          réalisées par les utilisateurs.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 7 – Responsabilités des utilisateurs
        </h2>
        <p>
          Les utilisateurs s’engagent à utiliser le service conformément aux
          présentes CGU et exclusivement dans le cadre de leurs missions
          professionnelles.
        </p>
        <p>Il leur est notamment interdit :</p>
        <ul>
          <li>de porter atteinte au bon fonctionnement du service ;</li>
          <li>
            de procéder à des extractions massives de données sans autorisation.
          </li>
        </ul>
        <p>
          L’utilisateur s’assure de garder ses identifiants secrets. Il assume
          les risques liés à l’utilisation de son adresse électronique et de son
          mot de passe.
        </p>
        <p>
          En s’identifiant sur le service, il certifie qu’il est un agent public
          qui oeuvre à une mission de service public relative à l’asile. Il est
          seul responsable de tout contenu qu’il dépose sur le service.
        </p>
        <p>
          Il est rappelé que toute personne procédant à une fausse déclaration
          pour elle-même ou pour autrui s’expose notamment aux sanctions prévues
          à l’article 441-1 du code pénal.
        </p>
        <p>
          Il veille à ne pas mettre en ligne de contenus ou informations
          contraires à la législation et réglementation applicables. Il veille
          notamment à ne pas communiquer de données sensibles ou de secrets
          protégés par la loi, et à ne pas publier de contenus illicites
          notamment dans les zones de champs libres.
        </p>
      </section>

      <section>
        <h2 className="text-title-blue-france">
          Article 8 – Responsabilités de l’Éditeur
        </h2>
        <p>
          Les sources des informations diffusées sur le service sont réputées
          fiables mais le service ne garantit pas être exempt de défauts,
          d’erreurs ou d’omissions.
        </p>
        <p>
          L’Éditeur s’engage à la sécurisation du service, notamment en prenant
          toutes les mesures nécessaires permettant de garantir la sécurité et
          la confidentialité des informations fournies.
        </p>
        <p>
          Il n’est en aucun cas tenu responsable des données importées et des
          modifications par l’utilisateur.
        </p>
        <p>
          L’Éditeur fournit les moyens nécessaires et raisonnables pour assurer
          un accès continu au service. Il se réserve la liberté de faire
          évoluer, de modifier ou de suspendre, sans préavis, le service pour
          des raisons de maintenance ou pour tout autre motif jugé nécessaire.
        </p>
        <p>
          En cas de manquement à une ou plusieurs des stipulations des
          présentes, l’Éditeur se réserve le droit de suspendre ou de supprimer
          le compte de l’utilisateur responsable.
        </p>
      </section>
    </article>
  );
}
