import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { SeeFileButton } from "@/app/components/common/SeeFileButton";
import { formatDate } from "@/app/utils/date.util";
import { MAX_EXPORT_ITEMS } from "@/constants";
import { useExportContext } from "@/contexts/ExportContext";
import { useStructureContext } from "@/contexts/StructureContext";
import { ControleType } from "@/types/controle.type";

export const ControleTable = (): ReactElement => {
  const isExporting = useExportContext();
  const { structure } = useStructureContext();

  const getControles = () => {
    const filteredControles = isExporting
      ? structure.controles?.slice(0, MAX_EXPORT_ITEMS)
      : structure.controles;

    return filteredControles?.map((controle) => [
      formatDate(controle.date),
      ControleType[controle.type as unknown as keyof typeof ControleType],
      <SeeFileButton
        key={controle.id}
        fileUploadKey={controle.fileUploads?.[0]?.key ?? ""}
      />,
    ]);
  };

  return (
    <div className="controle-table-container">
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getControles() || []}
        headers={["DATE", "TYPE", "RAPPORT"]}
      />
      <style>{`
        @media print {
          .controle-table-container th:nth-last-child(-n+1),
          .controle-table-container td:nth-last-child(-n+1) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
