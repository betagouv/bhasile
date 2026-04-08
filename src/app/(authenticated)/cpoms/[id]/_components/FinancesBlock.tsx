"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getBudgetTableLines } from "@/app/components/forms/finance/budget-tables/getBudgetTableLines";
import { cn } from "@/app/utils/classname.util";
import { getCpomStructureTypes } from "@/app/utils/cpom.util";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { StructureType } from "@/types/structure.type";

import { useCpomContext } from "../_context/CpomClientContext";
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
      <p
        className={cn(
          "max-w-4xl",
          cpomStructureTypes.length > 1 ? "mb-2" : "mb-6"
        )}
      >
        Dans cette vue, l’ensemble des montants correspondent à la gestion
        budgétaire{" "}
        <strong>
          à l’échelle du CPOM en prenant en compte toutes les structures d’un
          même type.
        </strong>{" "}
        Aussi, le tableau des affectations reflète uniquement des flux annuels.
        Les chiffres ne sont en aucun cas une estimation du stock.
      </p>
      {cpomStructureTypes.length > 1 && (
        <FinanceTypeSwitch
          cpomStructureTypes={cpomStructureTypes}
          currentType={currentType}
          handleChange={(value) => setCurrentType(value as StructureType)}
        />
      )}
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years })}
        enableBorders
        className="[&_thead_tr_th]:!text-sm"
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
    </Block>
  );
};
