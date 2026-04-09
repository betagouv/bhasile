"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { computeResultatNet } from "@/app/utils/budget.util";
import { isNullOrUndefined } from "@/app/utils/common.util";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ButtonAffectations } from "../ButtonAffectations";
import { getBudgetStaticTableLines } from "./getBudgetStaticTableLines";

export const StructureStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);

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
      {isAutorisee ? (
        <p>
          Dans cette vue, l’ensemble des montants correspond à la gestion
          budgétaire <strong>à l’échelle de la structure</strong>, que celle-ci
          fasse partie d’un CPOM ou non. Aussi, le tableau des affectations
          reflète uniquement des flux annuels. Les chiffres ne sont en aucun cas
          une estimation du stock.
        </p>
      ) : (
        <p>
          Dans cette vue, l’ensemble des montants correspond à la gestion
          budgétaire <strong>à l’échelle de la structure</strong>, que celle-ci
          fasse partie d’un CPOM ou non.
        </p>
      )}
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
      >
        <BudgetTableLines
          years={years}
          lines={getBudgetStaticTableLines(isAutorisee, isAffectationOpen)}
          budgets={enhancedBudgets}
          canEdit={false}
        />
        {(isAffectationOpen || isSubventionnee) && (
          <BudgetTableCommentLine
            years={years}
            label="Commentaire"
            budgets={enhancedBudgets}
            enabledYears={years}
            canEdit={false}
          />
        )}
      </Table>
      {isAutorisee && (
        <ButtonAffectations
          isAffectationOpen={isAffectationOpen}
          setIsAffectationOpen={setIsAffectationOpen}
        />
      )}
    </>
  );
};
