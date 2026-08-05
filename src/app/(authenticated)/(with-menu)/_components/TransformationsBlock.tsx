import { ReactElement } from "react";

import { getDashboardTransformations } from "@/app/api/dashboard/transformations/transformations.service";
import { getFirstParam, SearchParams } from "@/app/utils/searchParams.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { TRANSFORMATIONS_BLOCK_HEADER } from "./dashboardBlocks";
import { DashboardPagination } from "./DashboardPagination";
import { TransformationRow } from "./TransformationRow";

export const TransformationsBlock = async ({
  filters,
  user,
  searchParams,
}: Props): Promise<ReactElement> => {
  const page = Number(getFirstParam(searchParams.transformationsPage)) || 0;
  const { total, rows } = await getDashboardTransformations(
    filters,
    user,
    page
  );

  return (
    <Block>
      <BlockTitle
        title={TRANSFORMATIONS_BLOCK_HEADER.title}
        total={total}
        iconClassName={TRANSFORMATIONS_BLOCK_HEADER.icon}
      />

      <div className="grid grid-cols-[max-content_max-content_max-content_minmax(0,1fr)_max-content_auto] gap-x-4">
        {rows.map((row) => (
          <TransformationRow key={row.transformationId} row={row} />
        ))}
      </div>

      {rows.length === 0 && (
        <p className="px-4 py-6 text-sm text-mention-grey">
          Aucune création, transformation ou fermeture en cours.
        </p>
      )}

      {total > MIDDLE_PAGE_SIZE && (
        <div className="flex justify-center mt-4">
          <DashboardPagination total={total} pageParam="transformationsPage" />
        </div>
      )}
    </Block>
  );
};

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  searchParams: SearchParams;
};
