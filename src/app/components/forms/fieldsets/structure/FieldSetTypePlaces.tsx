import Notice from "@codegouvfr/react-dsfr/Notice";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { Table } from "@/app/components/common/Table";
import { cn } from "@/app/utils/classname.util";
import { getTypePlacesYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { FormKind } from "@/types/global";

import { YearlyTypePlace } from "./FieldSetTypePlace.tsx/YearlyTypePlace";

export const FieldSetTypePlaces = ({
  formKind = FormKind.FINALISATION,
  structure,
}: {
  structure: StructureApiType;
  formKind?: FormKind;
}) => {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const { formState } = useFormContext();

  const hasErrors = Object.values(formState.errors).length > 0;

  useEffect(() => {
    if (formState.errors.structureTypologies) {
      fieldsetRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [formState]);

  const { years } = getTypePlacesYearRange();

  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  return (
    <fieldset className="flex flex-col" ref={fieldsetRef}>
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        {formKind === FormKind.FINALISATION
          ? "Types de place"
          : "Détails et historique"}
      </legend>
      <p>
        Veuillez renseigner l’historique du nombre de places pour chaque
        typologie au 1er janvier de ces trois dernières années.
      </p>
      <Notice
        severity="info"
        title=""
        className="rounded [&_p]:flex  [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
        description="PMR : Personnes à Mobilité Réduite – LGBT : Lesbiennes, Gays, Bisexuels et Transgenres (ici places définies comme spécialisées) – FVV : Femmes Victimes de Violences, TEH : Traîte des Êtres Humains (ici places définies comme labellisées)"
      />

      <Table
        headings={["Année", "Autorisées", "PMR", "LGBT", "FVV/TEH"]}
        ariaLabelledBy=""
        className={cn(
          "[&_th]:px-0 text-center w-fit",
          hasErrors && "border-action-high-error"
        )}
      >
        {yearsToDisplay.map((year) => (
          <YearlyTypePlace key={year} year={year} />
        ))}
      </Table>
      {hasErrors && (
        <p className="text-label-red-marianne">
          Toutes les cases doivent être remplies
        </p>
      )}
    </fieldset>
  );
};
