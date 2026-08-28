import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Block } from "@/app/components/common/Block";
import { DocumentDownloadDropdown } from "@/app/components/download/DocumentDownloadDropdown";
import { useUserAction } from "@/app/hooks/useUserAction";
import { getLatestBudgetExecutoireYear } from "@/app/utils/budget.util";
import { getFinancesDownloadContent } from "@/app/utils/spreadsheet-download.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { useExportContext } from "@/contexts/ExportContext";
import { useStructureContext } from "@/contexts/StructureContext";

import { BudgetExecutoire } from "./BudgetExecutoire";
import { CpomStaticTable } from "./CpomStaticTable";
import { DocumentsFinanciers } from "./DocumentsFinanciers";
import { DotationChart } from "./DotationChart";
import { HistoriqueIndicateursGeneraux } from "./HistoriqueIndicateursGeneraux";
import { StructureCpomSwitch } from "./StructureCpomSwitch";
import { StructureStaticTable } from "./StructureStaticTable";

export const FinancesBlock = ({ startYear, endYear }: Props): ReactElement => {
  const { structure } = useStructureContext();
  const router = useRouter();
  const { trackFinancesSpreadsheetExport } = useUserAction();
  const isExporting = useExportContext();

  const [shouldShowCpom, setShouldShowCpom] = useState(false);

  const { isAutorisee, isSubventionnee } = structure;

  const openYear = isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR;
  const budgetExecutoireYear = getLatestBudgetExecutoireYear(
    structure.budgets,
    openYear
  );

  const wasInCpom = Object.values(structure.isInCpomPerYear).some(Boolean);

  return (
    <Block
      title="Finance"
      iconClass="fr-icon-money-euro-box-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/finances`);
      }}
      entity={structure}
      entityType="Structure"
      downloadDropdown={
        <DocumentDownloadDropdown
          downloadContent={getFinancesDownloadContent(structure)}
          onDownload={() => trackFinancesSpreadsheetExport(structure.id)}
        />
      }
    >
      <h4 className="text-title-blue-france text-lg">
        Budget exécutoire pour {budgetExecutoireYear}
      </h4>
      <div className="pb-6">
        <BudgetExecutoire year={budgetExecutoireYear} />
      </div>
      <div className="pb-12">
        <HistoriqueIndicateursGeneraux
          customStartYear={startYear}
          customEndYear={endYear}
        />
      </div>
      <h4 className="text-title-blue-france text-lg">
        Dotation et équilibre économique
      </h4>
      <div className="pb-12">
        <DotationChart
          budgets={structure.budgets}
          isAutorisee={structure.isAutorisee}
          startYear={startYear}
          endYear={endYear}
        />
      </div>
      <hr className="mb-10" />
      <div className="flex">
        <h4
          className="text-title-blue-france text-lg pr-6"
          id="gestionBudgetaireTitle"
        >
          Gestion budgétaire{isExporting && <> de la structure</>}
        </h4>
        {wasInCpom && !isExporting && (
          <StructureCpomSwitch
            handleChange={() =>
              setShouldShowCpom(
                (prevSetShouldShowCpom) => !prevSetShouldShowCpom
              )
            }
          />
        )}
      </div>
      {isExporting ? (
        <div>
          <div className="pb-4">
            <StructureStaticTable startYear={startYear} endYear={endYear} />
          </div>
          {shouldShowCpom && (
            <>
              <h4 className="text-title-blue-france text-lg mb-3 text-left font-bold">
                Gestion budgétaire du CPOM
              </h4>
              <CpomStaticTable startYear={startYear} endYear={endYear} />
            </>
          )}
        </div>
      ) : (
        <div className="pb-12">
          {shouldShowCpom ? (
            <CpomStaticTable startYear={startYear} endYear={endYear} />
          ) : (
            <StructureStaticTable startYear={startYear} endYear={endYear} />
          )}
        </div>
      )}

      <hr className="mb-10 print:hidden" />
      <h4 className="text-title-blue-france pb-0.5 text-lg mb-0 print:hidden">
        Documents financiers
      </h4>
      {isSubventionnee && (
        <h5 className="text-sm text-gray-500 font-normal italic mb-0 print:hidden">
          Retrouvez les Plans Pluriannuels d’Investissements (PPI) dans la
          section “Actes administratifs” s’ils existent et qu’ils ont été
          importés.
        </h5>
      )}
      <div className="pt-6 print:hidden">
        <DocumentsFinanciers />
      </div>
    </Block>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
