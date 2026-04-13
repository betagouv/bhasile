import { ReactElement } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { OperateurStatsApiType } from "@/app/hooks/useOperateurSearch";
import { MIDDLE_PAGE_SIZE } from "@/constants";

import { OperateurItem } from "./OperateurItem";

export const OperateurList = ({
  operateurs,
  totalOperateurs,
}: Props): ReactElement => {
  return (
    <>
      {operateurs.map((operateur) => (
        <div className="px-3 pt-3" key={operateur.id}>
          <OperateurItem
            name={operateur.name}
            nbStructures={operateur.nbStructures}
            totalPlaces={operateur.totalPlaces}
            pourcentageParc={operateur.pourcentageParc}
            structureTypes={operateur.structureTypes}
          />
        </div>
      ))}
      <div className="pt-4 flex justify-center items-center">
        <Pagination
          totalElements={totalOperateurs}
          pageSize={MIDDLE_PAGE_SIZE}
        />
      </div>
    </>
  );
};

type Props = {
  operateurs: OperateurStatsApiType[];
  totalOperateurs: number;
};
