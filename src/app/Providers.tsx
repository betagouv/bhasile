"use client";

import "@/app/utils/zodConfig";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, ReactElement, Suspense } from "react";

import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { FetchStateProvider } from "@/contexts/FetchStateContext";

export const Providers = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <SessionProvider>
      <AppAbilityProvider>
        <FetchStateProvider>
          <Suspense fallback={null}></Suspense>
          {children}
        </FetchStateProvider>
      </AppAbilityProvider>
    </SessionProvider>
  );
};
