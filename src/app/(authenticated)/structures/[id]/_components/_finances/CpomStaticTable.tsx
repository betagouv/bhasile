"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { AffectationTooltip } from "@/app/components/forms/finance/budget-tables/AffectationTooltip";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { BudgetTableRepriseEtatTooltip } from "@/app/components/forms/finance/budget-tables/BudgetTableRepriseEtatTooltip";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { getYearRange } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";

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
          lines={getLines(isAffectationOpen)}
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
      <Button
        priority="tertiary no outline"
        onClick={() => setIsAffectationOpen(!isAffectationOpen)}
        iconId={isAffectationOpen ? "fr-icon-eye-off-line" : "fr-icon-eye-line"}
        className="mt-4 ml-16"
        size="small"
      >
        {isAffectationOpen ? "Masquer" : "Voir"} le détail des affectations
      </Button>
    </>
  );
};

const getLines = (isAffectationOpen: boolean) => {
  const linesWithoutAffectation = [
    {
      title: "Budget",
      lines: [
        {
          name: "dotationDemandee",
          label: "Dotation demandée",
        },
        {
          name: "dotationAccordee",
          label: "Dotation accordée",
        },
      ],
    },
    {
      title: "Résultat",
      lines: [
        {
          name: "cumulResultatNet",
          label: "Cumul des résultats",
          subLabel: "des structures du CPOM",
          colored: true,
        },
        {
          name: "repriseEtat",
          label: <BudgetTableRepriseEtatTooltip />,
        },
        {
          name: "affectationReservesFondsDedies",
          label: <AffectationTooltip />,
        },
      ],
    },
  ];
  if (isAffectationOpen) {
    return [
      ...linesWithoutAffectation,
      {
        title: "Détail affectation",
        lines: [
          {
            name: "reserveInvestissement",
            label: "Réserve",
            subLabel: "dédiée à l'investissement",
          },
          {
            name: "chargesNonReconductibles",
            label: "Charges",
            subLabel: "non reconductibles",
          },
          {
            name: "reserveCompensationDeficits",
            label: "Réserve de compensation",
            subLabel: "des déficits",
          },
          {
            name: "reserveCompensationBFR",
            label: "Réserve de couverture",
            subLabel: "de BFR",
          },
          {
            name: "reserveCompensationAmortissements",
            label: "Réserve de compensation",
            subLabel: "des amortissements",
          },
          {
            name: "reportANouveau",
            label: "Report à nouveau",
          },
          {
            name: "autre",
            label: "Autre",
          },
        ],
      },
    ];
  }
  return linesWithoutAffectation;
};
