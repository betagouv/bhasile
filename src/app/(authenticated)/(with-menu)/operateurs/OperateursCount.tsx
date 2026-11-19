import { ReactElement } from "react";

import { getOperateurs } from "@/app/api/operateurs/operateur.service";
import { formatPlural } from "@/app/utils/string.util";
import { Filters } from "@/types/filters.type";

export const OperateursCount = async ({
  page,
  search,
  filters,
}: Props): Promise<ReactElement> => {
  const { totalOperateurs } = await getOperateurs(
    page,
    search,
    filters.departements,
    filters.operateurs,
    filters.types
  );

  return (
    <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
      {formatPlural(totalOperateurs, "entrée")}
    </p>
  );
};

type Props = {
  page: number;
  search: string | null;
  filters: Filters;
};
