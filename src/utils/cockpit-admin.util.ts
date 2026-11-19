import { COCKPIT_SECTIONS } from "@/config/cockpit-admin.config";
import { CockpitFeature } from "@/types/cockpit-admin.type";

export const findCockpitFeature = (pathname: string): CockpitFeature | null =>
  COCKPIT_SECTIONS.flatMap((section) => section.features).find(
    (feature) =>
      pathname === feature.href || pathname.startsWith(`${feature.href}/`)
  ) ?? null;
