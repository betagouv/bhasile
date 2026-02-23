"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getYearRange } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ButtonAffectations } from "../ButtonAffectations";
import { getCpomStaticTableLines } from "./getCpomStaticTableLines";

export const CpomStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  return (
    <>
      <p>
        Dans cette vue, l’ensemble des montants correspondent à la gestion
        budgétaire <strong>à l’échelle du CPOM</strong>.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
      >
        <BudgetTableLines
          years={years}
          lines={getCpomStaticTableLines(isAffectationOpen)}
          cpomStructures={structure?.cpomStructures}
          canEdit={false}
        />
        {isAffectationOpen && (
          <BudgetTableCommentLine
            label="Commentaire"
            cpomStructures={structure?.cpomStructures}
            enabledYears={years}
            canEdit={false}
          />
        )}
      </Table>
      <ButtonAffectations
        isAffectationOpen={isAffectationOpen}
        setIsAffectationOpen={setIsAffectationOpen}
      />
    </>
  );
};
