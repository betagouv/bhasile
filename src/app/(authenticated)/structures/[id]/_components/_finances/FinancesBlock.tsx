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
  const isConventionnee = isStructureSubventionnee(structure.type);
  const wasInCpom = wasStructureInCpom(structure, years);

  const budgetExecutoireYear = isAutorisee
    ? AUTORISEE_OPEN_YEAR
    : SUBVENTIONNEE_OPEN_YEAR;

  return (
    <Block
      title="Finances"
      iconClass="fr-icon-money-euro-box-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/04-finance`);
      }}
    >
      <div className="pb-2">
        <h4 className="text-title-blue-france pb-2 fr-h6">
          Budget exécutoire pour {budgetExecutoireYear}
        </h4>
        <BudgetExecutoire year={budgetExecutoireYear} />
      </div>
      <div className="pb-5">
        <HistoriqueIndicateursGeneraux />
      </div>
      <h4 className="text-title-blue-france pb-2 fr-h6">
        Dotation et équilibre économique
      </h4>
      <div className="pb-5">
        <DotationChart />
      </div>
      <h4 className="text-title-blue-france fr-h6" id="gestionBudgetaireTitle">
        Gestion budgétaire
      </h4>
      {wasInCpom && (
        <StructureCpomSwitch
          handleChange={() =>
            setShouldShowCpom((prevSetShouldShowCpom) => !prevSetShouldShowCpom)
          }
        />
      )}
      <div className="pb-5">
        {shouldShowCpom ? <CpomStaticTable /> : <StructureStaticTable />}
      </div>
      <hr className="mt-12 mb-12" />
      <h4 className="text-title-blue-france pb-2 fr-h6 mb-0">
        Documents administratifs et financiers transmis par l’opérateur
      </h4>
      {isConventionnee && (
        <h5 className="text-sm text-gray-500 font-normal italic">
          Retrouvez les Plans Pluriannuels d’Investissements (PPI) dans la
          section “Actes administratifs” s’ils existent et qu’ils ont été
          importés.
        </h5>
      )}
      <DocumentsFinanciers />
    </Block>
  );
};
