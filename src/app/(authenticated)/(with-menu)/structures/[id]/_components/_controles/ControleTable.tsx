import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { SeeFileButton } from "@/app/components/common/SeeFileButton";
import { formatDate } from "@/app/utils/date.util";
import { useStructureContext } from "@/contexts/StructureContext";
import { ControleType } from "@/types/controle.type";

export const ControleTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const getControles = () => {
    return structure?.controles?.map((controle) => [
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
