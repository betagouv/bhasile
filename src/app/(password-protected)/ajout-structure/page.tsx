import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

export default async function AjoutStructurePage(): Promise<ReactElement> {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <h2 className="flex flex-col items-center gap-4 text-center text-xl font-bold mb-2 text-title-blue-france">
        <i className="fr-icon-draft-line text-action-high-blue-france text-4xl [&::before]:[--icon-size:5rem]"></i>
        Vous allez créer la page dédiée
        <br />à votre structure sur Place d’Asile.
      </h2>
      <p className="text-center mb-10">
        Nous vous remercions pour cette contribution à l’outil !<br />
        <br />
        Nous estimons à une heure la durée moyenne pour rassembler et saisir
        l’ensemble des données demandées.
        <br />
        <strong>
          Ce formulaire ne fonctionne pas de façon collaborative, votre
          progression ne sera visible que sur votre ordinateur : vous ne pouvez
          démarrer et terminer le remplissage de ce formulaire que depuis un
          même poste.
        </strong>
        <br />
        C’est pourquoi nous vous conseillons de réunir l’ensemble des
        informations et des documents en amont.
      </p>
      <div className="bg-white rounded-lg p-6 max-w-xl mb-10">
        <h3 className="text-base font-bold mb-4 text-title-blue-france text-center">
          Aperçu des informations et documents
          <br />
          nécessaires au formulaire
        </h3>
        <ul className="p-0">
          <li className="flex items-start gap-2 mb-3">
            <i className="fr-icon-check-line text-action-high-blue-france text-sm [&::before]:[--icon-size:1.5rem]"></i>
            <span>
              Informations générales (date de création, code FINESS, types de
              publics, dates des différents conventions...) ;
            </span>
          </li>
          <li className="flex items-start gap-2 mb-3">
            <i className="fr-icon-check-line text-action-high-blue-france text-sm [&::before]:[--icon-size:1.5rem]"></i>
            <span>Information de contact de la structure ;</span>
          </li>
          <li className="flex items-start gap-2 mb-3">
            <i className="fr-icon-check-line text-action-high-blue-france text-sm [&::before]:[--icon-size:1.5rem]"></i>
            <span>
              Adresse administrative, ensemble des adresses d’hébergement et
              nombre de places autorisées correspondant à chacune de celles-ci ;
            </span>
          </li>
          <li className="flex items-start gap-2 mb-3">
            <i className="fr-icon-check-line text-action-high-blue-france text-sm [&::before]:[--icon-size:1.5rem]"></i>
            <span>
              Historique des types de places (total autorisées, spécialisées,
              labellisées et PMR) sur les cinq dernières années ;
            </span>
          </li>
          <li className="flex items-start gap-2 mb-3">
            <i className="fr-icon-check-line text-action-high-blue-france text-sm [&::before]:[--icon-size:1.5rem]"></i>
            <span>
              Ensemble des documents financiers disponibles sur les cinq
              dernières années (budget prévisionnel, compte administratif,
              rapport d’activité...).
            </span>
          </li>
        </ul>
      </div>
      <Button
        size="large"
        linkProps={{
          href: `/ajout-structure/selection`,
          "aria-label": "Je commence à remplir le formulaire",
        }}
      >
        Je commence à remplir le formulaire
        <span className="inline-block ml-2 fr-icon-arrow-right-line text-white"></span>
      </Button>
    </div>
  );
}
