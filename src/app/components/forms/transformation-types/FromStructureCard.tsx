import { StructureCard } from "@/app/components/StructureCard";
import { StructureApiRead } from "@/schemas/api/structure.schema";

export const FromStructureCard = ({ structure }: Props) => {
  if (!structure || !structure.codeBhasile) {
    return null;
  }

  return (
    <div className="mb-6">
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
  structure?: StructureApiRead;
};
