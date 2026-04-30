"use client";

import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/(structure)/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { getErrorMessages } from "@/app/utils/getErrorMessages.util";
import { getRealCreationYear } from "@/app/utils/structure.util";

import { CustomNotice } from "../../common/CustomNotice";
import { getIndicateurFinancierTableHeading } from "./budget-tables/getIndicateurFinancierTableHeading";
import { getIndicateurFinancierTableLines } from "./budget-tables/getIndicateurFinancierTableLines";
import { getIndicateurFinancierTablePreHeading } from "./budget-tables/getIndicateurFinancierTablePreHeading";
import { IndicateurFinancierTableLines } from "./budget-tables/IndicateurFinancierTableLines";

export const IndicateursFinanciers = () => {
  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });
  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { watch, formState } = parentFormContext || localForm;

  const indicateursFinanciers = watch("indicateursFinanciers");

  const errorMessages = getErrorMessages(formState, "indicateursFinanciers");

  return (
    <fieldset className="flex flex-col gap-6 min-w-0 w-full">
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        Indicateurs généraux
      </legend>
      <CustomNotice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit"
        description="Le taux d’encadrement s’obtient en divisant le nombre de places autorisées par le nombre d’ETP total (ex: “12 places gérées par un ETP” dans une structure de 96 places avec 8 ETP). Le coût journalier est le coût de la structure pour une journée et pour une place, défini dans les documents contractuels (ex: “23,50€ par jour par place”)."
      />
      <p className="mb-0">
        Veuillez renseigner l’historique de ces indicateurs financiers au 1er
        janvier de chaque année.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        preHeadings={getIndicateurFinancierTablePreHeading({
          years: yearsToDisplay,
        })}
        headings={getIndicateurFinancierTableHeading({
          years: yearsToDisplay,
        })}
        hasErrors={errorMessages.length > 0}
        enableBorders
        stickFirstColumn
      >
        <IndicateurFinancierTableLines
          lines={getIndicateurFinancierTableLines()}
          years={yearsToDisplay}
          indicateursFinanciers={indicateursFinanciers}
        />
      </Table>
      {errorMessages.length > 0 &&
        errorMessages.map((errorMessage) => (
          <p className="text-label-red-marianne" key={errorMessage}>
            {errorMessage}
          </p>
        ))}
    </fieldset>
  );
};
