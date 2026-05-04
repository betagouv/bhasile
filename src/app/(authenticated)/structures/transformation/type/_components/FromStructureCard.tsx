import { useFetchStructure } from "@/app/hooks/useFetchStructure";

export const FromStructureCard = ({ structureId }: Props) => {
  const { structure } = useFetchStructure(structureId);

  if (!structure) {
    return null;
  }

  return (
    <div className="mb-8 p-4 rounded-sm border flex gap-4 relative border-default-grey">
      <span className="fr-icon-community-line fr-icon--md text-title-blue-france" />
      <div>
        <strong className="uppercase font-bold text-title-blue-france">
          {structure.nom}
        </strong>
        <div className="text-sm">
          {structure.codeBhasile} - {structure.type}, {structure.operateur.name}
          , {structure.departementAdministratif}
        </div>
      </div>
    </div>
  );
};

type Props = {
  structureId: number;
};
