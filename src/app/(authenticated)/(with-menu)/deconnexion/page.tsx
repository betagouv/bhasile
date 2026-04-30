"use client";

import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { ReactElement, useEffect } from "react";

export default function Deconnexion(): ReactElement {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.data) {
      const idTokenHint = (session.data as Session & { id_token: string })
        .id_token;
      const callbackUrl = `/deconnexion/proconnect?id_token_hint=${idTokenHint}`;
      signOut({ redirect: false, callbackUrl }).then((signOutResponse) =>
        router.push(signOutResponse.url)
      );
    }
  }, [router, session]);

  return <div className="p-2">Déconnexion en cours...</div>;
}
