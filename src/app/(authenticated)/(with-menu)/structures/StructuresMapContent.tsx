import { ReactElement } from "react";

import {
  getCommunePoints,
  getStructureMapPoints,
} from "@/app/api/structures/structure.service";
import { StructuresQuery } from "@/types/structure-list.type";

import { StructuresMapLoader } from "./StructuresMapLoader";

export const StructuresMapContent = async ({
  query,
}: {
  query: StructuresQuery;
}): Promise<ReactElement> => {
  if (query.mode === "places") {
    const { communes } = await getCommunePoints(query);
    return <StructuresMapLoader communes={communes} />;
  }

  const points = await getStructureMapPoints(query);

  return <StructuresMapLoader points={points} />;
};
