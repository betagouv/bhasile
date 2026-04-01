"use client";

import { PureAbility } from "@casl/ability";
import { useSession } from "next-auth/react";
import { createContext, PropsWithChildren } from "react";

import { defineAbilityFor } from "@/lib/casl/abilities";
import { SessionUser } from "@/types/global";

export const AbilityContext = createContext<PureAbility>(new PureAbility([]));

export function AbilityProvider({ children }: PropsWithChildren) {
  const session = useSession();

  const user = session?.data?.user as SessionUser;

  const ability = defineAbilityFor(user);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
