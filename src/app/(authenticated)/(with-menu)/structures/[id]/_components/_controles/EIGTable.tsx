import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement, useState } from "react";

import { SimplePagination } from "@/app/components/common/SimplePagination";
import { formatDate } from "@/app/utils/date.util";
import { MAX_EXPORT_ITEMS, SHORT_PAGE_SIZE } from "@/constants";
import { useExportContext } from "@/contexts/ExportContext";
import { useStructureContext } from "@/contexts/StructureContext";

import { DemarcheNumeriqueInfo } from "./DemarcheNumeriqueInfo";

export const EIGTable = (): ReactElement => {
  const isExporting = useExportContext();
  const { structure } = useStructureContext();
  const evenementsIndesirablesGraves = structure?.evenementsIndesirablesGraves;
  const [currentPage, setCurrentPage] = useState(0);

  const getEvenementsIndesirablesGraves = () => {
    if (!evenementsIndesirablesGraves) {
      return [];
    }

    const itemsToDisplay = isExporting
      ? evenementsIndesirablesGraves.slice(0, MAX_EXPORT_ITEMS)
      : evenementsIndesirablesGraves;

    return itemsToDisplay
      .map((evenementIndesirableGrave) => [
        evenementIndesirableGrave.numeroDossier,
        formatDate(evenementIndesirableGrave.evenementDate),
        formatDate(evenementIndesirableGrave.declarationDate),
        evenementIndesirableGrave.type,
      ])
      .filter((_, index) => {
        if (isExporting) {
          return true;
        }

        return (
          index >= SHORT_PAGE_SIZE * currentPage &&
          index < SHORT_PAGE_SIZE * currentPage + SHORT_PAGE_SIZE
        );
      });
  };

  const totalItems = evenementsIndesirablesGraves?.length ?? 0;

  return (
    <>
      <DemarcheNumeriqueInfo />
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getEvenementsIndesirablesGraves()}
        headers={["DOSSIER", "ÉVÉNEMENT", "DÉCLARATION", "NATURE DES FAITS"]}
      />
      {!isExporting && totalItems > SHORT_PAGE_SIZE && (
        <div className="pt-4 flex justify-center items-center print:hidden">
          <SimplePagination
            totalElements={totalItems}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};
