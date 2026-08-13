import { ReactElement } from "react";

import { Block } from "@/types/ressources.type";

import { ResourceBlock } from "./ResourceBlock";

export const ResourcesBlockList = ({
  blocks,
  search = "",
}: Props): ReactElement => {
  return (
    <div className="flex flex-col gap-3 max-w-7xl w-full mx-auto px-3 py-6">
      {blocks.map((block) => (
        <ResourceBlock key={block.id} block={block} />
      ))}

      {blocks.length === 0 && (
        <p className="text-mention-grey text-center py-12 mb-0">
          {buildEmptyMessage(search)}
        </p>
      )}
    </div>
  );
};

const buildEmptyMessage = (search: string): string => {
  if (search.trim().length === 0) {
    return "Aucun contenu publié pour le moment.";
  }
  return `Aucun résultat pour « ${search} ».`;
};

type Props = {
  blocks: Block[];
  search?: string;
};
