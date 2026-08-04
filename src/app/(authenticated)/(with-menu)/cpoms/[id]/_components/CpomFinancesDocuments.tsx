import Accordion from "@codegouvfr/react-dsfr/Accordion";

import { DownloadItem } from "@/app/components/common/DownloadItem";
import { getYearRange } from "@/app/utils/date.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";

export const CpomFinancesDocuments = ({
  documentsFinanciers,
  structureType,
}: Props) => {
  const documentsFinanciersOfType = documentsFinanciers.filter(
    (documentFinancier) => documentFinancier.structureType === structureType
  );
  const { years } = getYearRange();

  return (
    <div>
      <h3 className="text-title-blue-france text-lg mb-4">
        Documents financiers
      </h3>
      {documentsFinanciersOfType.length === 0 ? (
        <p className="text-disabled-grey mb-0">Aucun document importé</p>
      ) : (
        years.map((year) => {
          const yearDocuments = documentsFinanciersOfType.filter(
            (documentFinancier) => documentFinancier.year === year
          );
          if (yearDocuments.length === 0) {
            return null;
          }
          return (
            <Accordion label={year} key={year}>
              <div className="grid grid-cols-3 gap-5">
                {yearDocuments.map((documentFinancier) => (
                  <div key={documentFinancier.id}>
                    <DownloadItem item={documentFinancier} />
                  </div>
                ))}
              </div>
            </Accordion>
          );
        })
      )}
    </div>
  );
};

type Props = {
  documentsFinanciers: DocumentFinancierApiType[];
  structureType: StructureType;
};
