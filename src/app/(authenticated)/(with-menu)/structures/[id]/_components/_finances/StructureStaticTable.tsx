"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getTransformationMarkers } from "@/app/components/transformation-markers/getTransformationMarkers";
import { TransformationMarkers } from "@/app/components/transformation-markers/TransformationMarkers";
import { computeResultatNet } from "@/app/utils/budget.util";
import { getYearRange } from "@/app/utils/date.util";
import { useExportContext } from "@/contexts/PrintContext";
import { useStructureContext } from "@/contexts/StructureContext";

import { ButtonAffectations } from "../ButtonAffectations";
import { getBudgetStaticTableLines } from "./getBudgetStaticTableLines";

export const StructureStaticTable = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { structure } = useStructureContext();
  const isExporting = useExportContext();

  const isAutorisee = structure?.isAutorisee ?? false;
  const isSubventionnee = structure?.isSubventionnee ?? false;

  const years =
    startYear && endYear
      ? getYearRange({
          startYear,
          endYear,
        }).years.reverse()
      : getYearRange({ order: "desc" }).years;

  const markers = getTransformationMarkers(structure?.history, years);

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  const effectiveIsAffectationOpen = isAffectationOpen || isExporting;

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
        stickFirstColumn
        overlay={
          markers.length > 0 && (
            <TransformationMarkers markers={markers} years={years} />
          )
        }
      >
        <BudgetTableLines
          years={years}
          lines={getBudgetStaticTableLines(
            isAutorisee,
            effectiveIsAffectationOpen
          )}
          budgets={enhancedBudgets}
          canEdit={false}
        />
        {(effectiveIsAffectationOpen || isSubventionnee) && (
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
