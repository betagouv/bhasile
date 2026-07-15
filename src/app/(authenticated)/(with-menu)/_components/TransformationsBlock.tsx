import { ReactElement } from "react";

import { getDashboardTransformations } from "@/app/api/dashboard/transformations/transformations.service";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { TransformationRow } from "./TransformationRow";

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
};

export const TransformationsBlock = async ({
  filters,
  user,
}: Props): Promise<ReactElement> => {
  const rows = await getDashboardTransformations(filters, user);

  return (
    <Block>
      <div className="flex items-center gap-2 p-4">
        <BlockTitle
          title="Créations, transformations et fermetures de structures"
          total={rows.length}
          iconClassName="fr-icon-community-line"
        />
      </div>

      <div className="grid grid-cols-[max-content_max-content_max-content_minmax(0,1fr)_max-content_auto] gap-x-4 px-4">
        {rows.map((row) => (
          <TransformationRow key={row.transformationId} row={row} />
        ))}
      </div>

      {rows.length === 0 && (
        <p className="border-t border-default-grey px-4 py-6 text-sm text-mention-grey">
          Aucune création, transformation ou fermeture en cours.
        </p>
      )}
    </Block>
  );
};
