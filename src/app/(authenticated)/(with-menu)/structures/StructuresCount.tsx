import { ReactElement } from "react";

import {
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
  const total =
    query.vue === "carte"
      ? (await getStructureMapPoints(query)).length
      : await getStructuresTotal(query);

  return (
    <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
      {formatPlural(total, "entrée")}
    </p>
  );
};
