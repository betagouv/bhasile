import { ReactElement } from "react";

import { PageHeader } from "@/components/PageHeader";

import { CockpitFeatureTile } from "./_components/CockpitFeatureTile";
import { COCKPIT_SECTIONS } from "./cockpit-admin.features";

export default function CockpitAdmin(): ReactElement {
  return (
    <div className="h-full w-full flex flex-col">
      <PageHeader title="Cockpit admin" withFilters={false} />
      <div className="flex flex-col gap-10 p-6">
        {COCKPIT_SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="fr-h6 text-title-blue-france mb-4">
              {section.title}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0 m-0">
              {section.features.map((feature) => (
                <li key={feature.href} className="p-0">
                  <CockpitFeatureTile feature={feature} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
