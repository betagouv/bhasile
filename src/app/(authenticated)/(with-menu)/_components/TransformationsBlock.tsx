import { ReactElement } from "react";

import { getDashboardTransformations } from "@/app/api/dashboard/transformations/transformations.service";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { TransformationRow } from "./TransformationRow";

export const TransformationsBlock = async ({
  filters,
  user,
}: Props): Promise<ReactElement> => {
  const rows = await getDashboardTransformations(filters, user);

  return (
    <Block>
      <BlockTitle
        title="Créations, transformations et fermetures de structures"
        total={rows.length}
        iconClassName="fr-icon-community-line"
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
    </Block>
  );
};

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
};
