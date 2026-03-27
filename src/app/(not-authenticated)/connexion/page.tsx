"use client";

import { ProConnectButton } from "@codegouvfr/react-dsfr/ProConnectButton";
import { useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { ReactElement, useEffect } from "react";

import { AccesRefuse } from "./AccesRefuse";

export default function Login(): ReactElement {
  const searchParams = useSearchParams();

  const login = async (): Promise<void> => {
    signIn("proconnect", {
      callbackUrl: `${process.env.NEXT_PUBLIC_URL}/structures`,
    });
  };

  useEffect(() => {
    if (searchParams.get("accesRefuse")) {
      signOut({ redirect: false });
      // TODO : remplacer par une variable d'environnement
      const proConnectLogoutUrl = `https://fca.integ01.dev-agentconnect.fr/api/v2/session/end?post_logout_redirect_uri=${window.location.origin}/connexion`;
      window.location.href = proConnectLogoutUrl;
    }
  }, [searchParams]);

  return (
    <div className="flex justify-center">
      <div className="flex-col">
        {searchParams.get("accesRefuse") && <AccesRefuse />}
        <div className="max-w-[600px] px-25.5 py-14 bg-alt-grey">
          <h2 className="fr-h4">Connexion à Bhasile</h2>
          <p className="fr-text--lg">
            <strong>
              Agent·es de département, de région ou de la Direction de l’Asile ?
              Connectez-vous à Bhasile pour piloter les structures et opérateurs
              de votre parc d’hébergement.
            </strong>
          </p>
          <p className="fr-text--sm">
            ProConnect est la solution proposée par l’État pour sécuriser et
            simplifier la connexion aux services en ligne en tant que
            professionnel.
          </p>
          <ProConnectButton onClick={login} />
        </div>
      </div>
    </div>
  );
}
