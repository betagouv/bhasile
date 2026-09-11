import { ReactElement } from "react";

import { BHASILE_CONTACT_EMAIL } from "@/constants";

export default function Accessibilite(): ReactElement {
  return (
    <article>
      <h1>Déclaration d’accessibilité</h1>
      <p>
        Établie le <span>11 septembre 2026</span>.
      </p>
      <p>
        <span>Le ministère de l’Intérieur</span> s’engage à rendre son service
        accessible, conformément à l’article 47 de la loi n° 2005-102 du 11
        février 2005.
      </p>
      <p>
        À cette fin, nous mettons en œuvre la stratégie et les actions
        suivantes&nbsp;:
      </p>
      <ul>
        <li>
          <a href="https://beta.gouv.fr/accessibilite/schema-pluriannuel">
            Schéma pluriannuel
          </a>
        </li>
        <li>
          <a href="https://beta.gouv.fr/accessibilite/plan-2025">Plan 2025</a>
        </li>
        <li>
          <a href="https://beta.gouv.fr/accessibilite/bilan-2024">Bilan 2024</a>
        </li>
      </ul>
      <p></p>
      <p>
        Cette déclaration d’accessibilité s’applique à <strong>Bhasile</strong>{" "}
        <span>
          (<span>https://www.bhasile.beta.gouv.fr</span>)
        </span>
        .
      </p>
      <h2>État de conformité</h2>
      <p>
        <strong>Bhasile</strong> est{" "}
        <strong>
          <span data-printfilter="lowercase">non conforme</span>
        </strong>{" "}
        avec le{" "}
        <abbr title="Référentiel général d’amélioration de l’accessibilité">
          RGAA
        </abbr>
        .{" "}
        <span>
          Le site n’a encore pas été audité.
          <br />
        </span>
      </p>
      <h3>Contenus non soumis à l’obligation d’accessibilité</h3>
      <p>
        Le système de cartographie des structures n’est pas soumis à
        l’accessibilité : une alternative sous forme de tableau existe sur la
        même page.
      </p>
      <h2>Établissement de cette déclaration d’accessibilité</h2>
      <p>
        Cette déclaration a été établie le <span>11 septembre 2026</span>.
      </p>
      <h3>Technologies utilisées</h3>
      <p>
        L’accessibilité de <span>Bhasile</span> s’appuie sur les technologies
        suivantes&nbsp;:
      </p>
      <ul className="technical-information technologies-used">
        <li>HTML</li>
        <li>CSS</li>
        <li>JavaScript</li>
      </ul>
      <h2>Amélioration et contact</h2>
      <p>
        Si vous n’arrivez pas à accéder à un contenu ou à un service, vous
        pouvez contacter le responsable de <span>Bhasile</span> pour être
        orienté vers une alternative accessible ou obtenir le contenu sous une
        autre forme.
      </p>
      <ul className="basic-information feedback h-card">
        <li>
          Téléphones&nbsp;:{" "}
          <span>{process.env.NEXT_PUBLIC_BHASILE_PHONE_NUMBERS}</span>
        </li>
        <li>
          E-mail&nbsp;:{" "}
          <a href="mailto:lucas.pastel.ext@beta.gouv.fr">
            lucas.pastel.ext@beta.gouv.fr
          </a>
        </li>

        <li>
          Formulaire de contact&nbsp;:{" "}
          <a href={`mailto:${BHASILE_CONTACT_EMAIL}`}>Nous contacter</a>
        </li>
        <li>
          Adresse&nbsp;: <span>DINUM, Ségur, Paris</span>
        </li>
      </ul>
      <p>
        Nous essayons de répondre dans les <span>2 jours ouvrés</span>.
      </p>
      <h2>Voie de recours</h2>
      <p>
        Cette procédure est à utiliser dans le cas suivant&nbsp;: vous avez
        signalé au responsable du site internet un défaut d’accessibilité qui
        vous empêche d’accéder à un contenu ou à un des services du portail et
        vous n’avez pas obtenu de réponse satisfaisante.
      </p>
      <p>Vous pouvez&nbsp;:</p>
      <ul>
        <li>
          Écrire un message au{" "}
          <a href="https://formulaire.defenseurdesdroits.fr/">
            Défenseur des droits
          </a>
        </li>
        <li>
          Contacter{" "}
          <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
            le délégué du Défenseur des droits dans votre région
          </a>
        </li>
        <li>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de
          timbre)&nbsp;:
          <br />
          Défenseur des droits
          <br />
          Libre réponse 71120 75342 Paris CEDEX 07
        </li>
      </ul>
      <hr />
      <p>
        Cette déclaration d’accessibilité a été créée le{" "}
        <span>11 septembre 2026</span> grâce au{" "}
        <a href="https://betagouv.github.io/a11y-generateur-declaration/#create">
          Générateur de Déclaration d’Accessibilité
        </a>
        .
      </p>
    </article>
  );
}
