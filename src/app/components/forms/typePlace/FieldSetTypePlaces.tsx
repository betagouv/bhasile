import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { Table } from "@/app/components/common/Table";
import { getTypePlacesYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { FormKind } from "@/types/global";

import { getTypePlaceEditHeadings } from "./getTypePlaceEditHeadings";
import { PlacesAutoriseesLine } from "./PlacesAutoriseesLine";
import { TypePlaceLine } from "./TypePlaceLine";

const TYPE_PLACE_LINES = [
  { name: "pmr", label: "Places PMR" },
  { name: "lgbt", label: "Places LGBT", subLabel: "(labellisées)" },
  { name: "fvvTeh", label: "Places FVV/TEH", subLabel: "(spécialisées)" },
];

export const FieldSetTypePlaces = ({
  formKind = FormKind.FINALISATION,
  structure,
}: {
  structure: StructureApiRead;
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
  const yearsToDisplay = [...years]
    .sort((firstYear, secondYear) => firstYear - secondYear)
    .filter((year) => year >= startYear);

  return (
    <fieldset className="flex flex-col" ref={fieldsetRef}>
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        {formKind === FormKind.FINALISATION
          ? "Types de place"
          : "Détails et historique"}
      </legend>
      <p>
        Veuillez renseigner l’historique du nombre de places pour chaque
        typologie au 31 décembre de ces dernières années.
        <br /> À partir de {PLACES_VERSIONED_FROM_YEAR}, la modification du
        nombre de places autorisées doit obligatoirement passer par une
        contraction ou une extension de la structure.
      </p>
      <CustomNotice
        severity="info"
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit"
        description="PMR : Personnes à Mobilité Réduite – LGBT : Lesbiennes, Gays, Bisexuels et Transgenres (ici places définies comme labellisées) – FVV : Femmes Victimes de Violences, TEH : Traîte des Êtres Humains (ici places définies comme spécialisées)"
      />

      <Table
        ariaLabelledBy=""
        headings={getTypePlaceEditHeadings(yearsToDisplay)}
        enableBorders
        stickFirstColumn
        hasErrors={hasErrors}
        className="text-center"
      >
        <PlacesAutoriseesLine
          years={yearsToDisplay}
          isCapacityLocked={structure.isCurrentVersionFromTransformation}
        />
        {TYPE_PLACE_LINES.map((line) => (
          <TypePlaceLine key={line.name} line={line} years={yearsToDisplay} />
        ))}
      </Table>
      {hasErrors && (
        <p className="text-label-red-marianne" data-form-error>
          Toutes les cases doivent être remplies
        </p>
      )}
    </fieldset>
  );
};
