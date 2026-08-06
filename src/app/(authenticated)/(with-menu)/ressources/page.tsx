import { ReactElement } from "react";

import { readBlocks } from "@/utils-server/ressources.server.util";

import { ResourceBlock } from "./_components/ResourceBlock";

export default function Ressources(): ReactElement {
  const blocks = readBlocks();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] items-center sticky top-0 bg-lifted-grey z-10">
        <h2 className="text-title-blue-france fr-h5 mb-0">
          Modèles et ressources
        </h2>
      </div>
      <div className="flex flex-col gap-3 max-w-7xl w-full mx-auto p-6">
        {blocks.map((block) => (
          <ResourceBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
