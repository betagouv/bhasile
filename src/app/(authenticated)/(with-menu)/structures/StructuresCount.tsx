import { ReactElement } from "react";

import {
  getCommunePoints,
  getStructureMapPoints,
  getStructuresTotal,
} from "@/app/api/structures/structure.service";
import { formatPlural } from "@/app/utils/string.util";
import { StructuresQuery } from "@/types/structure-list.type";

export const StructuresCount = async ({
  query,
}: {
  query: StructuresQuery;
}): Promise<ReactElement> => {
  return (
    <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
      {await getCountLabel(query)}
    </p>
  );
};

const getCountLabel = async (query: StructuresQuery): Promise<string> => {
  if (query.vue === "tableau") {
    return formatPlural(await getStructuresTotal(query), "structure");
  }
  if (query.mode === "places") {
    return formatPlural((await getCommunePoints(query)).totalPlaces, "place");
  }
  return formatPlural((await getStructureMapPoints(query)).length, "structure");
};
