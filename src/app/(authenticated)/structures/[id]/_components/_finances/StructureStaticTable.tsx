"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { isNullOrUndefined } from "@/app/utils/common.util";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ButtonAffectations } from "../ButtonAffectations";
import { getStructureStaticTableLines } from "./getStructureStaticTableLines";

export const StructureStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  const enhancedBudgets = structure?.budgets?.map((budget) => {
    return {
      ...budget,
      resultatNet: computeResultatNet(
        budget.totalProduits,
        budget.totalCharges
      ),
      resultatNetProposeParOperateur: computeResultatNet(
        budget.totalProduitsProposes,
        budget.totalChargesProposees
      ),
    };
  });

  return (
    <>
      <p>
        Dans cette vue, l’ensemble des montants correspondent à la gestion
        budgétaire <strong>à l’échelle de la structure</strong>,<br />
        que celle-ci fasse partie d’un CPOM ou non.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
      >
        <BudgetTableLines
          years={years}
          lines={getStructureStaticTableLines(isAutorisee, isAffectationOpen)}
          budgets={enhancedBudgets}
          canEdit={false}
        />
        {isAffectationOpen && (
          <BudgetTableCommentLine
            label="Commentaire"
            budgets={enhancedBudgets}
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

const computeResultatNet = (
  totalProduits: number | null | undefined,
  totalCharges: number | null | undefined
): number | undefined => {
  if (isNullOrUndefined(totalCharges) || isNullOrUndefined(totalProduits)) {
    return undefined;
  }
  return Number(totalProduits) - Number(totalCharges);
};
