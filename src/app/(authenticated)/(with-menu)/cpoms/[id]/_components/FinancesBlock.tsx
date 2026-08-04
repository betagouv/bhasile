"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getBudgetTableLines } from "@/app/components/forms/finance/budget-tables/getBudgetTableLines";
import { getCpomStructureTypes } from "@/app/utils/cpom.util";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { StructureType } from "@/types/structure.type";

import { useCpomContext } from "../_context/CpomClientContext";
import { CpomFinancesDocuments } from "./CpomFinancesDocuments";
import { FinanceTypeSwitch } from "./FinanceTypeSwitch";

export const FinancesBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const { years } = getYearRange({ order: "desc" });

  const cpomStructureTypes = getCpomStructureTypes(cpom);

  const [currentType, setCurrentType] = useState<StructureType>(
    cpomStructureTypes[0]
  );

  if (!cpomStructureTypes.length) {
    return null;
  }

  const isAutorisee = isStructureAutorisee(currentType);

  return (
    <Block
      title="Finances"
      iconClass="fr-icon-money-euro-box-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/finances`);
      }}
      entity={cpom}
      entityType="Cpom"
    >
      {cpomStructureTypes.length > 1 && (
        <FinanceTypeSwitch
          cpomStructureTypes={cpomStructureTypes}
          currentType={currentType}
          handleChange={(value) => setCurrentType(value as StructureType)}
        />
      )}
      <h4
        className="text-title-blue-france text-lg pr-6"
        id="gestionBudgetaire"
      >
        Gestion budgétaire
      </h4>
      <p className="max-w-4xl mb-6">
        Dans cette vue, l’ensemble des montants correspond à la gestion
        budgétaire{" "}
        <strong>
          à l’échelle du CPOM en prenant en compte toutes les structures d’un
          même type (ici {currentType}).
        </strong>{" "}
        Aussi, le tableau des affectations reflète uniquement des flux annuels.
        Les chiffres ne sont en aucun cas une estimation du stock.
      </p>

      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years })}
        enableBorders
        className="[&_thead_tr_th]:text-sm! mb-12"
        stickFirstColumn
      >
        <BudgetTableLines
          years={years}
          lines={getBudgetTableLines(isAutorisee)}
          budgets={cpom.budgets}
          canEdit={false}
          type={currentType}
        />
        <BudgetTableCommentLine
          years={years}
          label="Commentaire"
          budgets={cpom.budgets}
          canEdit={false}
          type={currentType}
        />
      </Table>
      <hr className="mb-10" />
      <CpomFinancesDocuments
        documentsFinanciers={cpom.documentsFinanciers ?? []}
        structureType={currentType}
      />
    </Block>
  );
};
