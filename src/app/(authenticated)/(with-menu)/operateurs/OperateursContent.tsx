import { ReactElement } from "react";

import { getOperateurs } from "@/app/api/operateurs/operateur.service";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { LIST_NAVIGATION_KEY } from "@/constants";

import { OperateurList } from "./OperateursList";

export const OperateursContent = async ({
  page,
  search,
}: Props): Promise<ReactElement> => {
  const { operateurs, totalOperateurs } = await getOperateurs(page, search);

  return (
    <ListLoader
      fetchStateName={LIST_NAVIGATION_KEY}
      itemCount={operateurs.length}
      entityName="operateur"
    >
      <OperateurList
        operateurs={operateurs}
        totalOperateurs={totalOperateurs}
      />
    </ListLoader>
  );
};

type Props = {
  page: number;
  search: string | null;
};
