"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ButtonAffectations } from "../ButtonAffectations";
import { getStructureStaticTableLines } from "./getStructureStaticTableLines";

export const CpomStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);

  return (
    <>
      <p>
        Dans cette vue, l’ensemble des montants correspondent à la gestion
        budgétaire <strong>à l’échelle du CPOM</strong>. Aussi, le tableau des
        affectations reflète uniquement des flux annuels. Les chiffres ne sont
        en aucun cas une estimation du stock.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
      >
        <BudgetTableLines
          years={years}
          lines={getStructureStaticTableLines(isAutorisee, isAffectationOpen)}
          cpomStructures={structure?.cpomStructures}
          canEdit={false}
        />
        {(isAffectationOpen || isSubventionnee) && (
          <BudgetTableCommentLine
            years={years}
            label="Commentaire"
            cpomStructures={structure?.cpomStructures}
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
