import { ReactNode } from "react";

import { CockpitFeatureHeader } from "../_components/CockpitFeatureHeader";

export default function CockpitFeatureLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-full w-full flex flex-col">
      <CockpitFeatureHeader />
      <div className="p-6">{children}</div>
    </div>
  );
}
