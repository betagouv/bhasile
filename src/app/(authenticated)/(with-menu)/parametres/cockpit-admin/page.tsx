import { ReactElement } from "react";

import { PageHeader } from "@/components/PageHeader";

export default function CockpitAdmin(): ReactElement {
  return (
    <div className="h-full w-full flex flex-col">
      <PageHeader title="Cockpit admin" withFilters={false} />
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span
          className="fr-icon-settings-5-line text-mention-grey"
          aria-hidden="true"
        />
        <p className="text-lg font-bold text-title-blue-france mb-0">
          Page en construction
        </p>
        <p className="text-sm text-mention-grey mb-0">
          Le cockpit admin sera bientôt disponible !
        </p>
      </div>
    </div>
  );
}
