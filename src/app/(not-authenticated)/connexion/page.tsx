"use client";

import { ProConnectButton } from "@codegouvfr/react-dsfr/ProConnectButton";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ReactElement } from "react";

import { AccesRefuse } from "./AccesRefuse";

export default function Login(): ReactElement {
  const searchParams = useSearchParams();

  const login = async (): Promise<void> => {
    signIn("proconnect", {
      callbackUrl: `${process.env.NEXT_PUBLIC_URL}/structures`,
    });
  };

  return (
    <div className="flex justify-center">
      <div className="flex-col">
        {searchParams.get("accesRefuse") && <AccesRefuse />}
        <div className="max-w-[600px] px-25.5 py-14 bg-alt-grey">
          <h2 className="text-2xl">Connexion à Bhasile</h2>
          <p className="text-lg">
            <strong>
              Agent·es de département, de région ou de la Direction de l’Asile ?
              Connectez-vous à Bhasile pour piloter les structures et opérateurs
              de votre parc d’hébergement.
            </strong>
          </p>
          <p className="text-sm">
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
