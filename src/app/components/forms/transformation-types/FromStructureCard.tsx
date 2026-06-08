import { StructureCard } from "@/app/components/StructureCard";
import { useFetchStructure } from "@/app/hooks/useFetchStructure";

export const FromStructureCard = ({ structureId }: Props) => {
  const { structure } = useFetchStructure(structureId);

  if (!structure || !structure.codeBhasile) {
    return null;
  }

  return (
    <div className="mb-8">
      <StructureCard
        nom={structure.nom}
        codeBhasile={structure.codeBhasile}
        type={structure.type}
        operateur={structure.operateur}
        departementAdministratif={structure.departementAdministratif}
      />
    </div>
  );
};

type Props = {
  structureId: number;
};
