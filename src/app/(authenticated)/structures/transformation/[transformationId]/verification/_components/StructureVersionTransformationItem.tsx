import { StructureCard } from "@/app/components/StructureCard";
import { formatDate, getYearFromDate } from "@/app/utils/date.util";
import { getPlacesSource } from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type Props = {
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const StructureVersionTransformationItem = ({
  structureVersionTransformation,
}: Props) => {
  const cardProps = buildCardProps(structureVersionTransformation);

  const effectiveDate =
    structureVersionTransformation.structureVersion?.effectiveDate;

  const placesLine = getPlacesLine(structureVersionTransformation);
  return (
    <div className="flex flex-col gap-3">
      {cardProps && <StructureCard {...cardProps} />}
      {effectiveDate && (
        <div className="flex items-center gap-2 text-sm">
          <span className="fr-icon-check-line fr-icon--sm text-title-blue-france" />
          <span>
            {getEffectiveDateLabel(structureVersionTransformation.type)} le{" "}
            <strong>{formatDate(effectiveDate)}</strong>
          </span>
        </div>
      )}
      {effectiveDate && placesLine && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`${placesLine.icon} fr-icon--sm text-title-blue-france`}
          />
          <span>
            <strong>
              {placesLine.count} {placesLine.label}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

type PlacesLine = { count: number; label: string; icon: string };

const buildCardProps = (
  structureVersionTransformation: StructureVersionTransformationApiRead
) => {
  const structureVersion = structureVersionTransformation.structureVersion;
  const nom = structureVersion?.nom;
  const codeBhasile = structureVersion?.structure?.codeBhasile;
  const structureType = structureVersionTransformation.structureType;
  const operateur =
    structureVersion?.structure?.operateur ??
    structureVersionTransformation.operateur;
  const departementAdministratif = structureVersion?.departementAdministratif;

  if (!nom || !structureType || !operateur || !departementAdministratif) {
    return null;
  }

  return {
    nom,
    codeBhasile,
    type: structureType,
    operateur,
    departementAdministratif,
  };
};

const getPlacesLine = (
  structureVersionTransformation: StructureVersionTransformationApiRead
): PlacesLine | null => {
  const effectiveDate =
    structureVersionTransformation.structureVersion?.effectiveDate;
  if (!effectiveDate) {
    return null;
  }

  if (
    structureVersionTransformation.type ===
    StructureVersionTransformationType.FERMETURE
  ) {
    const placesFermees = getPlacesSource(structureVersionTransformation);
    if (placesFermees === undefined || placesFermees <= 0) {
      return null;
    }
    return {
      count: placesFermees,
      label: "place(s) fermée(s)",
      icon: "fr-icon-close-line",
    };
  }

  const year = getYearFromDate(effectiveDate);
  const placesAutorisees =
    structureVersionTransformation.structureVersion?.structureTypologies?.find(
      (structureTypology) => structureTypology.year === year
    )?.placesAutorisees;
  if (placesAutorisees === undefined) {
    return null;
  }

  return {
    count: placesAutorisees,
    label: `places autorisées au total après ${getEffectiveDateLabel(
      structureVersionTransformation.type
    )}`,
    icon: "fr-icon-check-line",
  };
};

const getEffectiveDateLabel = (
  type: StructureVersionTransformationType
): string => {
  switch (type) {
    case StructureVersionTransformationType.CREATION:
      return "ouverture";
    case StructureVersionTransformationType.EXTENSION:
      return "extension";
    case StructureVersionTransformationType.CONTRACTION:
      return "contraction";
    case StructureVersionTransformationType.FERMETURE:
      return "fermeture";
  }
};
