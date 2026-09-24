import { ReactElement, Suspense } from "react";

import {
  readBlocks,
  readSuggestions,
} from "@/utils-server/ressources.server.util";

import { ResourcesBlockList } from "./_components/ResourcesBlockList";
import { RessourcesSkeleton } from "./_components/RessourcesSkeleton";

export const dynamic = "force-dynamic";

export default function Ressources(): ReactElement {
  const blocks = readBlocks();
  const suggestions = readSuggestions();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] items-center sticky top-0 bg-lifted-grey z-10">
        <h2 className="text-title-blue-france fr-h5 mb-0">
          Modèles et ressources
        </h2>
      </div>
      <Suspense fallback={<RessourcesSkeleton />}>
        <ResourcesBlockList blocks={blocks} suggestions={suggestions} />
      </Suspense>
    </div>
  );
}
