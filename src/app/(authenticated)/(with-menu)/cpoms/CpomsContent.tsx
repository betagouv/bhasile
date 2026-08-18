import { ReactElement } from "react";

import { getCpoms } from "@/app/api/cpoms/cpom.service";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { LIST_NAVIGATION_KEY } from "@/constants";
import { CpomsQuery } from "@/types/cpom.type";

import { CpomsTable } from "./_components/CpomsTable";

export const CpomsContent = async ({
  query,
}: {
  query: CpomsQuery;
}): Promise<ReactElement> => {
  const { cpoms, totalCpoms } = await getCpoms(
    query.page,
    query.departements,
    query.column,
    query.direction
  );

  return (
    <ListLoader
      fetchStateName={LIST_NAVIGATION_KEY}
      itemCount={cpoms.length}
      entityName="cpom"
    >
      <CpomsTable
        cpoms={cpoms}
        totalCpoms={totalCpoms}
        ariaLabelledBy="cpoms-titre"
      />
    </ListLoader>
  );
};
