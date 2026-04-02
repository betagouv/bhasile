"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getCpomLines } from "@/app/components/forms/finance/budget-tables/getCpomLines";
import { getYearRange } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";

export const FinancesBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter((year) =>
    isStructureInCpom(cpom.structure, year)
  );

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
      <p>
        Le tableau des affectations reflète uniquement des flux annuels. Les
        chiffres ne sont en aucun cas une estimation du stock.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years })}
        enableBorders
        className="[&_thead_tr_th]:!text-sm"
      >
        <BudgetTableLines
          years={years}
          lines={getCpomLines()}
          cpomMillesimes={cpom.cpomMillesimes}
          canEdit={false}
        />
        <BudgetTableCommentLine
          years={years}
          label="Commentaire"
          cpomMillesimes={cpom.cpomMillesimes}
          canEdit={false}
        />
      </Table>
    </Block>
  );
};
