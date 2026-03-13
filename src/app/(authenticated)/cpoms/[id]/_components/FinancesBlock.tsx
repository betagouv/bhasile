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

  return (
    <Block
      title="Finances"
      iconClass="fr-icon-money-euro-box-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/finances`);
      }}
    >
      <p>
        Concernant les affectations, ce tableau reflète le flux annuel et ne
        constitue en aucun cas un calcul ou du stock.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years })}
        enableBorders
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
