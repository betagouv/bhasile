"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { computeResultatNet } from "@/app/utils/budget.util";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ButtonAffectations } from "../ButtonAffectations";
import { getBudgetStaticTableLines } from "./getBudgetStaticTableLines";

export const CpomStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);

  const enhancedCpomStructures = structure?.cpomStructures?.map(
    (cpomStructure) => {
      return {
        ...cpomStructure,
        cpom: {
          ...cpomStructure?.cpom,
          budgets: cpomStructure?.cpom?.budgets?.map((budget) => {
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
          }),
        },
      };
    }
  );

  return (
    <>
      <p>
        Dans cette vue, l’ensemble des montants correspond à la gestion
        budgétaire <strong>à l’échelle du CPOM</strong>. Aussi, le tableau des
        affectations reflète uniquement des flux annuels. Les chiffres ne sont
        en aucun cas une estimation du stock.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
        stickFirstColumn
      >
        <BudgetTableLines
          years={years}
          lines={getBudgetStaticTableLines(
            isAutorisee,
            isAffectationOpen,
            true
          )}
          cpomStructures={enhancedCpomStructures}
          canEdit={false}
          type={structure?.type}
        />
        {(isAffectationOpen || isSubventionnee) && (
          <BudgetTableCommentLine
            years={years}
            label="Commentaire"
            cpomStructures={enhancedCpomStructures}
            enabledYears={years}
            canEdit={false}
            type={structure?.type}
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
