"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { PageHeader } from "@/components/PageHeader";

import {
  COCKPIT_ADMIN_URL,
  findCockpitFeature,
} from "../cockpit-admin.features";

export const CockpitFeatureHeader = (): ReactElement => {
  const pathname = usePathname();
  const feature = findCockpitFeature(pathname ?? "");

  return (
    <>
      <PageHeader
        title={feature?.title ?? "Cockpit admin"}
        withFilters={false}
      />
      <Link
        href={COCKPIT_ADMIN_URL}
        className="fr-link fr-icon-arrow-left-line fr-link--icon-left self-start mx-6 mt-6"
      >
        Retour au cockpit admin
      </Link>
    </>
  );
};
