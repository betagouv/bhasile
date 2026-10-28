"use client";

import { ProConnectButton } from "@codegouvfr/react-dsfr/ProConnectButton";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ReactElement } from "react";

import { clearStoredFilters } from "@/utils/filters.util";

import { AccesRefuse } from "./AccesRefuse";

export default function Login(): ReactElement {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const error = searchParams.get("error");

  const accesRefuse =
    searchParams.get("accesRefuse") === "true" ||
    Boolean(reason) ||
    Boolean(error);

  const login = async (): Promise<void> => {
    clearStoredFilters();
    signIn("proconnect", {
      callbackUrl: process.env.NEXT_PUBLIC_URL,
    });
  };

  return (
    <div className="flex justify-center">
      <div className="flex-col">
        {accesRefuse && <AccesRefuse reason={reason} error={error} />}
        <div className="max-w-150 px-25.5 py-14 bg-alt-grey">
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
