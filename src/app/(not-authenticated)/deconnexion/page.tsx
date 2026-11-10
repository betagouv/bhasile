"use client";

import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { ReactElement, useEffect, useRef } from "react";

export default function Deconnexion(): ReactElement | null {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isSigningOut = useRef(false);

  useEffect(() => {
    if (isSigningOut.current) {
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    if (status !== "authenticated" || !session) {
      return;
    }

    isSigningOut.current = true;
    const idTokenHint = (session as Session & { id_token: string }).id_token;
    const callbackUrl = `/deconnexion/proconnect?id_token_hint=${idTokenHint}`;

    signOut({ redirect: false, callbackUrl }).then((response) => {
      router.push(response.url);
    });
  }, [status, session, router]);

  return <div className="p-2">Déconnexion en cours...</div>;
}
