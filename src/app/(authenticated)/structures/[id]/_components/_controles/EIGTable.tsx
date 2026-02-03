import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement, useState } from "react";

import { SimplePagination } from "@/app/components/common/SimplePagination";
import { formatDate } from "@/app/utils/date.util";
import { SHORT_PAGE_SIZE } from "@/constants";

import { useStructureContext } from "../../_context/StructureClientContext";
import { DemarchesNumeriquesInfo } from "./DemarchesNumeriquesInfo";

export const EIGTable = (): ReactElement => {
  const { structure } = useStructureContext();
  const evenementsIndesirablesGraves = structure?.evenementsIndesirablesGraves;
  const [currentPage, setCurrentPage] = useState(0);

  const getEvenementsIndesirablesGraves = () => {
    return evenementsIndesirablesGraves
      ?.map((evenementIndesirableGrave) => [
        evenementIndesirableGrave.numeroDossier,
        formatDate(evenementIndesirableGrave.evenementDate),
        formatDate(evenementIndesirableGrave.declarationDate),
        evenementIndesirableGrave.type,
      ])
      .filter(
        (_, index) =>
          index >= SHORT_PAGE_SIZE * currentPage &&
          index < SHORT_PAGE_SIZE * currentPage + SHORT_PAGE_SIZE
      );
  };

  return (
    <>
      <DemarchesNumeriquesInfo />
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getEvenementsIndesirablesGraves() || []}
        headers={["DOSSIER", "ÉVÉNEMENT", "DÉCLARATION", "NATURE DES FAITS"]}
      />
      {evenementsIndesirablesGraves!.length > 6 && (
        <div className="pt-4 flex justify-center items-center">
          <SimplePagination
            totalElements={evenementsIndesirablesGraves!.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};
