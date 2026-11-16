import Link from "next/link";

import { StructureCard } from "@/app/components/StructureCard";
import { useCanUpdateDepartement } from "@/app/hooks/useCanUpdateStructure";
import { formatDate } from "@/app/utils/date.util";
import { pluralize } from "@/app/utils/string.util";
import {
  getPlacesSource,
  getStructureVersionDepartement,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";
import { getStructureVersionTransformationStepItems } from "@/utils/transformation-step-status.util";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const StructureVersionTransformationItem = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const cardProps = buildCardProps(structureVersionTransformation);

  const canUpdateDepartement = useCanUpdateDepartement();
  const firstIncompleteStep = getStructureVersionTransformationStepItems(
    transformation,
    structureVersionTransformation,
    canUpdateDepartement
  ).find((step) => step.status !== StepStatus.VALIDE);

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
      {firstIncompleteStep && (
        <Link
          href={firstIncompleteStep.route}
          className="fr-link fr-link--sm fr-icon-arrow-right-line fr-link--icon-right self-start"
        >
          Compléter les informations de la structure
        </Link>
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
  const departementAdministratif =
    getStructureVersionDepartement(structureVersion);

  if (!nom && !structureType && !operateur && !departementAdministratif) {
    return null;
  }

  return {
    nom,
    codeBhasile,
    type: structureType ?? undefined,
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
      label: `${pluralize(placesFermees, "place")} ${pluralize(
        placesFermees,
        "fermée"
      )}`,
      icon: "fr-icon-close-line",
    };
  }

  const placesAutorisees =
    structureVersionTransformation.structureVersion?.placesAutorisees;
  if (placesAutorisees === undefined || placesAutorisees === null) {
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
