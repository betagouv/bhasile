"use client";

import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";

import { CustomNotice } from "../../common/CustomNotice";
import { getIndicateurFinancierTableHeading } from "./budget-tables/getIndicateurFinancierTableHeading";
import { getIndicateurFinancierTablePreHeading } from "./budget-tables/getIndicateurFinancierTablePreHeading";

const CUTOFF_YEAR = 2024;

export const IndicateursGeneraux = () => {
  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });
  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  const indicateursFinanciers = watch("indicateursFinanciers");

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        Indicateurs généraux
      </legend>
      <CustomNotice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit"
        description="Le nombre d’ETP correspond à l’ensemble des employés de la structure (ex : “8 ETP”). Le taux d’encadrement est le nombre de places gérées par un ETP, obtenu en divisant le nombre de places autorisées par le nombre d’ETP total (ex: “12 places gérées par un ETP” dans une structure de 96 places avec 8 ETP). Le coût journalier est le coût de la structure pour une journée et pour une place, défini dans les documents contractuels (ex: “23,50€ par jour par place”)."
      />
      <p className="mb-0">
        Veuillez renseigner l’historique de ces indicateurs financiers au 1er
        janvier de chaque année.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        preHeadings={getIndicateurFinancierTablePreHeading({
          years: yearsToDisplay,
          cutOffYear: CUTOFF_YEAR,
        })}
        headings={getIndicateurFinancierTableHeading({
          years: yearsToDisplay,
          cutOffYear: CUTOFF_YEAR,
        })}
        enableBorders
      >
        <IndicateurFinancierTableLines
          years={yearsToDisplay}
          indicateursFinanciers={indicateursFinanciers}
        />
      </Table>
    </fieldset>
  );
};
