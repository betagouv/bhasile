import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Block } from "@/app/components/common/Block";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
  wasStructureInCpom,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";

import { useStructureContext } from "../../_context/StructureClientContext";
import { BudgetExecutoire } from "./BudgetExecutoire";
import { CpomStaticTable } from "./CpomStaticTable";
import { DocumentsFinanciers } from "./DocumentsFinanciers";
import { DotationChart } from "./DotationChart";
import { HistoriqueIndicateursGeneraux } from "./HistoriqueIndicateursGeneraux";
import { StructureCpomSwitch } from "./StructureCpomSwitch";
import { StructureStaticTable } from "./StructureStaticTable";

export const FinancesBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const [shouldShowCpom, setShouldShowCpom] = useState(false);

  const { years } = getYearRange({ order: "desc" });

  const isAutorisee = isStructureAutorisee(structure.type);
  const isSubventionnee = isStructureSubventionnee(structure.type);
  const wasInCpom = wasStructureInCpom(structure, years);

  const budgetExecutoireYear = isAutorisee
    ? AUTORISEE_OPEN_YEAR
    : SUBVENTIONNEE_OPEN_YEAR;

  return (
    <Block
      title="Finances"
      iconClass="fr-icon-money-euro-box-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/finances`);
      }}
      entity={structure}
      entityType="Structure"
    >
      <h4 className="text-title-blue-france text-lg">
        Budget exécutoire pour {budgetExecutoireYear}
      </h4>
      <div className="pb-6">
        <BudgetExecutoire year={budgetExecutoireYear} />
      </div>
      <div className="pb-12">
        <HistoriqueIndicateursGeneraux />
      </div>
      <h4 className="text-title-blue-france text-lg">
        Dotation et équilibre économique
      </h4>
      <div className="pb-12">
        <DotationChart />
      </div>
      <hr className="mb-10" />
      <h4
        className="text-title-blue-france text-lg"
        id="gestionBudgetaireTitle"
      >
        Gestion budgétaire
      </h4>
      {wasInCpom && (
        <StructureCpomSwitch
          handleChange={() =>
            setShouldShowCpom((prevSetShouldShowCpom) => !prevSetShouldShowCpom)
          }
        />
      )}
      <div className="pb-12">
        {shouldShowCpom ? <CpomStaticTable /> : <StructureStaticTable />}
      </div>
      <hr className="mb-10" />
      <h4 className="text-title-blue-france pb-0.5 text-lg mb-0">
        Documents financiers
      </h4>
      {isSubventionnee && (
        <h5 className="text-sm text-gray-500 font-normal italic mb-0">
          Retrouvez les Plans Pluriannuels d’Investissements (PPI) dans la
          section “Actes administratifs” s’ils existent et qu’ils ont été
          importés.
        </h5>
      )}
      <div className="pt-6">
        <DocumentsFinanciers />
      </div>
    </Block>
  );
};
