import Link from "next/link";
import { ReactElement } from "react";

export const Header = (): ReactElement => {
  return (
    <header role="banner" className="fr-header">
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <p className="fr-logo">
                    République
                    <br />
                    française
                  </p>
                </div>
              </div>
              <div className="fr-header__service">
                <Link href="/" title="Connexion - Bhasile">
                  <p className="fr-header__service-title">Bhasile</p>
                </Link>
                <p className="fr-header__service-tagline">
                  Faciliter le pilotage du parc d’hébergement des demandeurs
                  d’asile
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
