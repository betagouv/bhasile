import { StructureCard } from "@/app/components/StructureCard";
import { formatDate, getYearFromDate } from "@/app/utils/date.util";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

type Props = {
  structureTransformation: StructureTransformationApiRead;
};

export const StructureTransformationItem = ({
  structureTransformation,
}: Props) => {
  const cardProps = buildCardProps(structureTransformation);

  const effectiveDate = structureTransformation.structureVersion?.effectiveDate;

  const placesAutorisees = getPlacesAutorisees(structureTransformation);

  return (
    <div className="flex flex-col gap-2">
      {cardProps && <StructureCard {...cardProps} />}
      {effectiveDate && (
        <div className="flex items-center gap-2 text-sm">
          <span className="fr-icon-check-line fr-icon--sm text-title-blue-france" />
          <span>
            {getEffectiveDateLabel(structureTransformation.type)} le{" "}
            <strong>{formatDate(effectiveDate)}</strong>
          </span>
        </div>
      )}
      {effectiveDate && placesAutorisees !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="fr-icon-check-line fr-icon--sm text-title-blue-france" />
          <span>
            <strong>{placesAutorisees} places autorisées</strong> au total
          </span>
        </div>
      )}
    </div>
  );
};

const buildCardProps = (
  structureTransformation: StructureTransformationApiRead
) => {
  const structureVersion = structureTransformation.structureVersion;
  const nom = structureVersion?.nom;
  const codeBhasile = structureVersion?.structure?.codeBhasile;
  const structureType = structureVersion?.type;
  const operateur =
    structureVersion?.structure?.operateur ?? structureTransformation.operateur;
  const departementAdministratif = structureVersion?.departementAdministratif;

  if (
    !nom ||
    !codeBhasile ||
    !structureType ||
    !operateur ||
    !departementAdministratif
  ) {
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

const getPlacesAutorisees = (
  structureTransformation: StructureTransformationApiRead
): number | undefined => {
  if (structureTransformation.type === StructureTransformationType.FERMETURE) {
    return undefined;
  }

  const effectiveDate = structureTransformation.structureVersion?.effectiveDate;
  if (!effectiveDate) {
    return undefined;
  }

  const year = getYearFromDate(effectiveDate);

  return structureTransformation.structureVersion?.structureTypologies?.find(
    (structureTypology) => structureTypology.year === year
  )?.placesAutorisees;
};

const getEffectiveDateLabel = (type: StructureTransformationType): string => {
  switch (type) {
    case StructureTransformationType.CREATION:
      return "ouverture";
    case StructureTransformationType.EXTENSION:
      return "extension";
    case StructureTransformationType.CONTRACTION:
      return "contraction";
    case StructureTransformationType.FERMETURE:
      return "fermeture";
  }
};
