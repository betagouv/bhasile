"use client";

import "@/app/utils/zodConfig";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, ReactElement, Suspense } from "react";

import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { FetchStateProvider } from "@/contexts/FetchStateContext";

import { Tracking } from "./components/Tracking";

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
