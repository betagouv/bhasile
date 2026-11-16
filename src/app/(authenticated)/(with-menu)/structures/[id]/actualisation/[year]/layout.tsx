import { ReactNode } from "react";

import { ModificationGuard } from "../../_components/ModificationGuard";

export default function ActualisationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModificationGuard>
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </ModificationGuard>
  );
}
