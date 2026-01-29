<<<<<<< HEAD
import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/cpom/[id]/_context/CpomClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { getBudgetTableHeading } from "./getBudgetTableHeading";
import { getCpomLines } from "./getCpomLines";

export const CpomTable = () => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes");

  const { cpom } = useCpomContext();

  const { years } = getYearRange({ order: "desc" });

  const yearsInCpom = years.filter(
    (year) => year >= cpom.yearStart && year <= cpom.yearEnd
  );

  console.log(cpomMillesimes);
=======
import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { BudgetTableRepriseEtatTooltip } from "./BudgetTableRepriseEtatTooltip";
import { getBudgetTableHeading } from "./getBudgetTableHeading";

export const CpomTable = () => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  const cpomStructures = watch("cpomStructures");

  const yearsInCpom = years.filter((year) =>
    isStructureInCpom(structure, year)
  );

  if (!cpomStructures) {
    return null;
  }
>>>>>>> origin/migration

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
<<<<<<< HEAD
      headings={getBudgetTableHeading({ years })}
      enableBorders
    >
      <BudgetTableLines
        lines={getCpomLines(true)}
        cpomMillesimes={cpomMillesimes}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomMillesimes={cpomMillesimes}
=======
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
    >
      <BudgetTableLines
        lines={getLines(isAutorisee)}
        cpomStructures={cpomStructures}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
>>>>>>> origin/migration
        enabledYears={yearsInCpom}
      />
    </Table>
  );
};
<<<<<<< HEAD
=======

const getLines = (isAutorisee: boolean) => {
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
>>>>>>> origin/migration
