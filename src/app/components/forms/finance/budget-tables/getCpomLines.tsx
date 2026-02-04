import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";

import { BudgetTableRepriseEtatTooltip } from "./BudgetTableRepriseEtatTooltip";

export const getCpomLines = (isAutorisee: boolean) => {
  return [
    {
      title: "Budget",
      lines: [
        {
          name: "dotationDemandee",
          label: "Dotation demandée",
          disabledYearsStart: isAutorisee ? 0 : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "dotationAccordee",
          label: "Dotation accordée",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR + 1
            : SUBVENTIONNEE_OPEN_YEAR + 1,
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
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "repriseEtat",
          label: <BudgetTableRepriseEtatTooltip />,
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "affectationReservesFondsDedies",
          label: "Affectation",
          subLabel: "réserves & fonds dédiés",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
      ],
    },
    {
      title: "Détail affectation",
      lines: [
        {
          name: "reserveInvestissement",
          label: "Réserve",
          subLabel: "dédiée à l'investissement",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "chargesNonReconductibles",
          label: "Charges",
          subLabel: "non reductibles",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "reserveCompensationDeficits",
          label: "Réserve de compensation",
          subLabel: "des déficits",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "reserveCompensationBFR",
          label: "Réserve de couverture",
          subLabel: "de BFR",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "reserveCompensationAmortissements",
          label: "Réserve de compensation",
          subLabel: "des amortissements",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "fondsDedies",
          label: "Fonds dédiés",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "reportANouveau",
          label: "Report à nouveau",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "autre",
          label: "Autre",
          disabledYearsStart: isAutorisee
            ? AUTORISEE_OPEN_YEAR
            : SUBVENTIONNEE_OPEN_YEAR + 1,
        },
      ],
    },
  ];
};
