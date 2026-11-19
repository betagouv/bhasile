"use client";

import "@/app/utils/zodConfig";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, ReactElement, Suspense } from "react";

import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { FetchStateProvider } from "@/contexts/FetchStateContext";

export const Providers = ({
  session,
  children,
}: PropsWithChildren<Props>): ReactElement => {
  return (
    <SessionProvider session={session}>
      <AppAbilityProvider>
        <FetchStateProvider>
          <Suspense fallback={null}></Suspense>
          {children}
        </FetchStateProvider>
      </AppAbilityProvider>
    </SessionProvider>
  );
};

type Props = {
  session: Session | null;
};
