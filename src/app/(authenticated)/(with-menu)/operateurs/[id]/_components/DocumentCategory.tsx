import { ReactElement } from "react";

import { DownloadItem } from "@/app/components/common/DownloadItem";
import { DocumentOperateurCategory } from "@/types/operateur.type";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const DocumentCategory = ({ categoryName }: Props): ReactElement => {
  const { operateur } = useOperateurContext();

  const actesAdministratifs = operateur.actesAdministratifs.filter(
    (acteAdministratif) => acteAdministratif.category === categoryName
  );
  const documentsFinanciers = operateur.documentsFinanciers.filter(
    (documentFinancier) => documentFinancier.category === categoryName
  );
  const documentsOperateur = [...actesAdministratifs, ...documentsFinanciers];

  return documentsOperateur.length > 0 ? (
    <div className="grid grid-cols-3 gap-5 p-4">
      {documentsOperateur.map((document) => (
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
