import { ReactElement } from "react";

import { getStructureListItems } from "@/app/api/structures/structure.service";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { LIST_NAVIGATION_KEY } from "@/constants";
import { SessionUser } from "@/types/global";
import { StructuresQuery } from "@/types/structure-list.type";

import { StructuresTable } from "./_components/StructuresTable";

export const StructuresContent = async ({
  query,
  user,
}: Props): Promise<ReactElement> => {
  const { structures, totalStructures } = await getStructureListItems(query);

  return (
    <ListLoader
      fetchStateName={LIST_NAVIGATION_KEY}
      itemCount={structures.length}
      entityName="structure"
    >
      <StructuresTable
        key={query.isClosed ? "fermees" : "actives"}
        structures={structures}
        totalStructures={totalStructures}
        ariaLabelledBy="structures-titre"
        isClosed={Boolean(query.isClosed)}
        user={user}
      />
    </ListLoader>
  );
};

type Props = {
  query: StructuresQuery;
  user: SessionUser;
};
