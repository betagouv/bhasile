import "../../build.css";
import "./globals.css"; // IMPORTANT cet import doit rester en premier pour que les layers css soient respectés

import type { Metadata } from "next";
import { PropsWithChildren, Suspense } from "react";

import { NameChangeNotice } from "./components/NameChangeNotice";
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

export default function RootLayout({ children }: PropsWithChildren) {
  console.log("Environnement :", process.env.NODE_ENV);

  const lang = "fr";
  return (
    <html
      {...getHtmlAttributes({ lang })}
      data-scroll-behavior="smooth"
      dir="ltr"
    >
      <head>
        <DsfrHead />
      </head>
      <body className="overscroll-none bg-default-grey-hover h-full">
        <DsfrProvider lang={lang}>
          <StartDsfrOnHydration />

          <Providers>
            <Suspense>
              <NameChangeNotice />
              {children}
            </Suspense>
          </Providers>
        </DsfrProvider>
      </body>
    </html>
  );
}
