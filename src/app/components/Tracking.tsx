"use client";

import "@/app/utils/zodConfig";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export const Tracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      trackAppRouter({
        url: process.env.NEXT_PUBLIC_MATOMO_URL!,
        siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID!,
        pathname,
        searchParams,
        disableCookies: true,
      });
    }
  }, [searchParams, pathname]);

  return null;
};
