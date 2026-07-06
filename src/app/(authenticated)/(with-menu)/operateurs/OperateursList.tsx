import Link from "next/link";
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
        <Link
          title={`Détails de l'operateur ${operateur.name}`}
          className="px-3 pt-3 block"
          key={operateur.id}
          href={`operateurs/${operateur.id}`}
        >
          <OperateurItem
            id={operateur.id}
            name={operateur.name}
            nbStructures={operateur.nbStructures}
            totalPlaces={operateur.totalPlaces}
            pourcentageParc={operateur.pourcentageParc}
            structureTypes={operateur.structureTypes}
            logo={operateur.logo}
          />
        </Link>
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
