"use client";

import "@/app/utils/zodErrorMap";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, ReactElement, Suspense } from "react";

import { Tracking } from "./components/Tracking";
import { AbilityProvider } from "./context/AbilityContext";
import { FetchStateProvider } from "./context/FetchStateContext";

export const Providers = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <SessionProvider>
      <AbilityProvider>
        <FetchStateProvider>
          <Suspense fallback={null}>
            <Tracking />
          </Suspense>
          {children}
        </FetchStateProvider>
      </AbilityProvider>
    </SessionProvider>
  );
};
