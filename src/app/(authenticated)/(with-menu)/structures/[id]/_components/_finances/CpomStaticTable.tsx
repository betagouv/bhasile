"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { computeResultatNet } from "@/app/utils/budget.util";
import { getYearRange } from "@/app/utils/date.util";
import { useExportContext } from "@/contexts/ExportContext";
import { useStructureContext } from "@/contexts/StructureContext";

import { ButtonAffectations } from "../ButtonAffectations";
import { getBudgetStaticTableLines } from "./getBudgetStaticTableLines";

export const CpomStaticTable = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { structure } = useStructureContext();
  const isExporting = useExportContext();

  const years =
    startYear && endYear
      ? getYearRange({
          startYear,
          endYear,
        }).years.reverse()
      : getYearRange({ order: "desc" }).years;

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  const effectiveIsAffectationOpen = isAffectationOpen || isExporting;

  const isAutorisee = structure?.isAutorisee ?? false;
  const isSubventionnee = structure?.isSubventionnee ?? false;

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
            effectiveIsAffectationOpen,
            true
          )}
          cpomStructures={enhancedCpomStructures}
          canEdit={false}
          type={structure?.type}
        />
        {(effectiveIsAffectationOpen || isSubventionnee) && (
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
        <div className="print:hidden">
          <ButtonAffectations
            isAffectationOpen={isAffectationOpen}
            setIsAffectationOpen={setIsAffectationOpen}
          />
        </div>
      )}
    </>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
