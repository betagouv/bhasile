"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { filterBlocks } from "@/app/utils/ressources.util";
import { Block } from "@/types/ressources.type";

import { ResourcesBlockList } from "./ResourcesBlockList";
import { ResourcesSearch } from "./ResourcesSearch";

export const ResourcesContent = ({
  blocks,
  suggestions,
}: Props): ReactElement => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";

  return (
    <>
      <ResourcesSearch suggestions={suggestions} />
      <ResourcesBlockList
        blocks={filterBlocks(blocks, search)}
        search={search}
      />
    </>
  );
};

type Props = {
  blocks: Block[];
  suggestions: string[];
};
