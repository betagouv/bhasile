import dynamic from "next/dynamic";
import { ReactElement, useMemo } from "react";

import Loader from "@/app/components/ui/Loader";

const DsfrMap = dynamic(
  () =>
    import("@/app/(authenticated)/(with-menu)/statistiques/_components/cartographie/DsfrMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Loader />
      </div>
    ),
  }
);

export const FranceMap = (): ReactElement => {
  // TODO : remplacer avec les vraies données
  const FAKE_REGIONS_DATA: Record<string, number> = useMemo(
    () => ({
      ARA: 32,
      BFC: 8,
      BRE: 38,
      CVL: 12,
      GES: 67,
      HDF: 89,
      IDF: 0,
      NOR: 23,
      NAQ: 56,
      OCC: 78,
      PDL: 95,
      PAC: 101,
      "971": 21,
      "972": 32,
      "973": 45,
      "974": 78,
      "976": 98,
    }),
    []
  );

  return <DsfrMap zoneData={FAKE_REGIONS_DATA} />;
};
