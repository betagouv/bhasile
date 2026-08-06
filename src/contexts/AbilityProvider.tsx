"use client";

import { AbilityProvider } from "@casl/react";
import { useSession } from "next-auth/react";
import { PropsWithChildren } from "react";

import { defineAbilityFor } from "@/lib/casl/abilities";
import { SessionUser } from "@/types/global";

export function AppAbilityProvider({ children }: PropsWithChildren) {
  const session = useSession();

  const user = session?.data?.user as SessionUser;

  const ability = defineAbilityFor(user);

  return <AbilityProvider value={ability}>{children}</AbilityProvider>;
}
