"use client";

import "@/app/utils/zodErrorMap";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, ReactElement, Suspense } from "react";

import { Tracking } from "./components/Tracking";
import { AppAbilityProvider } from "./context/AbilityContext";
import { FetchStateProvider } from "./context/FetchStateContext";

export const Providers = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <SessionProvider>
      <AppAbilityProvider>
        <FetchStateProvider>
          <Suspense fallback={null}>
            <Tracking />
          </Suspense>
          {children}
        </FetchStateProvider>
      </AppAbilityProvider>
    </SessionProvider>
  );
};
