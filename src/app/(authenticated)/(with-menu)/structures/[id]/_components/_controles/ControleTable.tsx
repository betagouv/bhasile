import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { SeeFileButton } from "@/app/components/common/SeeFileButton";
import { formatDate } from "@/app/utils/date.util";
import { ControleType } from "@/types/controle.type";

import { useStructureContext } from "../../_context/StructureClientContext";

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
    <Table
      bordered={true}
      className="full-width-table"
      caption=""
      data={getControles() || []}
      headers={["DATE", "TYPE", "RAPPORT"]}
    />
  );
};
