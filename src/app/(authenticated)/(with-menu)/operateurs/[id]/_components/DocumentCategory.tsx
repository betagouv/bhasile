import { ReactElement } from "react";

import { DownloadItem } from "@/app/components/common/DownloadItem";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const DocumentCategory = ({ categoryName }: Props): ReactElement => {
  const { operateur } = useOperateurContext();

  const operateurDocuments = operateur.documents.filter(
    (document) => document.category === categoryName
  );
  return operateurDocuments.length > 0 ? (
    <div className="grid grid-cols-3 gap-5 p-4">
      {operateurDocuments.map((document) => (
        <DownloadItem key={document.id} item={document} />
      ))}
    </div>
  ) : (
    <div className="m-4">Aucun document importé</div>
  );
};

type Props = {
  categoryName: DocumentOperateurCategory;
};
