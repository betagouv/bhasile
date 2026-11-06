"use client";

import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { ReactElement, useEffect } from "react";

export default function Deconnexion(): ReactElement | null {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      return;
    }

    const idTokenHint = (session as Session & { id_token: string }).id_token;
    const callbackUrl = `/deconnexion/proconnect?id_token_hint=${idTokenHint}`;

    signOut({ redirect: false, callbackUrl }).then((response) =>
      router.push(response.url)
    );
  }, [status, session, router]);

  if (status === "unauthenticated") {
    router.replace("/");
    return null;
  }

  return <div className="p-2">Déconnexion en cours...</div>;
}
