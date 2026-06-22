import { StructureCard } from "@/app/components/StructureCard";
import { formatDate, getYearFromDate } from "@/app/utils/date.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type Props = {
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const StructureVersionTransformationItem = ({
  structureVersionTransformation,
}: Props) => {
  const cardProps = buildCardProps(structureVersionTransformation);

  const effectiveDate = structureVersionTransformation.structureVersion?.effectiveDate;

  const placesAutorisees = getPlacesAutorisees(structureVersionTransformation);

  return (
    <div className="flex flex-col gap-2">
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
  structureVersionTransformation: StructureVersionTransformationApiRead
) => {
  const structureVersion = structureVersionTransformation.structureVersion;
  const nom = structureVersion?.nom;
  const codeBhasile = structureVersion?.structure?.codeBhasile;
  const structureType = structureVersion?.type;
  const operateur =
    structureVersion?.structure?.operateur ?? structureVersionTransformation.operateur;
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

const getPlacesAutorisees = (
  structureVersionTransformation: StructureVersionTransformationApiRead
): number | undefined => {
  if (structureVersionTransformation.type === StructureVersionTransformationType.FERMETURE) {
    return undefined;
  }

  const effectiveDate = structureVersionTransformation.structureVersion?.effectiveDate;
  if (!effectiveDate) {
    return undefined;
  }

  const year = getYearFromDate(effectiveDate);

  return structureVersionTransformation.structureVersion?.structureTypologies?.find(
    (structureTypology) => structureTypology.year === year
  )?.placesAutorisees;
};

const getEffectiveDateLabel = (type: StructureVersionTransformationType): string => {
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
