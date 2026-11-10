import "../../build.css";
import "./globals.css"; // IMPORTANT cet import doit rester en premier pour que les layers css soient respectés

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren, Suspense } from "react";

import { authOptions } from "@/lib/next-auth/auth";

import { DsfrProvider, StartDsfrOnHydration } from "./dsfr-bootstrap";
import {
  DsfrHead,
  getHtmlAttributes,
} from "./dsfr-bootstrap/server-only-index";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Bhasile",
  description: "Piloter le parc de logements pour demandeurs d’asile",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const lang = "fr";
  const session = await getServerSession(authOptions);
  return (
    <html
      {...getHtmlAttributes({ lang })}
      data-scroll-behavior="smooth"
      dir="ltr"
    >
      <head>
        <DsfrHead doDisableFavicon />
      </head>
      <body className="overscroll-none bg-default-grey-hover h-full">
        <DsfrProvider lang={lang}>
          <StartDsfrOnHydration />
          <Providers session={session}>
            <Suspense>{children}</Suspense>
          </Providers>
        </DsfrProvider>
      </body>
    </html>
  );
}
