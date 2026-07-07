import { StructureCard } from "@/app/components/StructureCard";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";

type Props = {
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const TransformationSelectionSummaryItem = ({
  structureVersionTransformation,
}: Props) => {
  const structureVersion = structureVersionTransformation.structureVersion;
  const structure = structureVersion?.structure;

  const nom = structureVersion?.nom ?? structure?.nom;
  const type = structureVersionTransformation.structureType;
  const operateur =
    structure?.operateur ?? structureVersionTransformation.operateur;
  const departementAdministratif =
    structureVersion?.departementAdministratif ??
    structure?.departementAdministratif;

  if (nom && type && operateur && departementAdministratif) {
    return (
      <StructureCard
        nom={nom}
        codeBhasile={structure?.codeBhasile}
        type={type}
        operateur={operateur}
        departementAdministratif={departementAdministratif}
      />
    );
  }

  return (
    <div className="p-4 rounded-sm border border-dashed border-default-grey flex gap-4 items-center">
      <span className="fr-icon-add-circle-line fr-icon--md text-title-blue-france" />
      <span className="text-sm">
        Nouvelle structure à créer{type ? ` (${type})` : ""}
      </span>
    </div>
  );
};
