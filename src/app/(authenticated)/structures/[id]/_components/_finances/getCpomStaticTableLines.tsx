import { AffectationTooltip } from "@/app/components/forms/finance/budget-tables/AffectationTooltip";
import { BudgetTableRepriseEtatTooltip } from "@/app/components/forms/finance/budget-tables/BudgetTableRepriseEtatTooltip";

export const getCpomStaticTableLines = (isAffectationOpen: boolean) => {
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
