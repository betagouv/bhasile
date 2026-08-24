import { ReactElement } from "react";

import { getStructureMapPoints } from "@/app/api/structures/structure.service";
import { StructuresQuery } from "@/types/structure-list.type";

import { StructuresMapLoader } from "./StructuresMapLoader";

export const StructuresMapContent = async ({
  query,
}: {
  query: StructuresQuery;
}): Promise<ReactElement> => {
  const points = await getStructureMapPoints(query);

  return <StructuresMapLoader points={points} />;
};
