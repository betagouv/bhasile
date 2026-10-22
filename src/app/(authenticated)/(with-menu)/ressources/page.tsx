import { ReactElement, Suspense } from "react";

import { PageHeader } from "@/components/PageHeader";

import { ResourcesBlockList } from "./_components/ResourcesBlockList";
import { RessourcesSkeleton } from "./_components/RessourcesSkeleton";

export default function Ressources(): ReactElement {
  return (
    <div className="h-full w-full flex flex-col">
      <PageHeader title="Modèles et ressources" />
      <Suspense fallback={<RessourcesSkeleton />}>
        <ResourcesBlockList />
      </Suspense>
    </div>
  );
}
