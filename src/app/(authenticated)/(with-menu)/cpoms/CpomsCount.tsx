import { ReactElement } from "react";

import { getCpoms } from "@/app/api/cpoms/cpom.service";
import { formatPlural } from "@/app/utils/string.util";
import { CpomsQuery } from "@/types/cpom.type";

export const CpomsCount = async ({
  query,
}: {
  query: CpomsQuery;
}): Promise<ReactElement> => {
  const { totalCpoms } = await getCpoms(
    query.page,
    query.departements,
    query.column,
    query.direction
  );

  return (
    <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
      {formatPlural(totalCpoms, "entrée")}
    </p>
  );
};
