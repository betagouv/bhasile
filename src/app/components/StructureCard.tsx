import { StructureType } from "@/types/structure.type";

type Props = {
  nom: string;
  codeBhasile?: string;
  type: StructureType;
  operateur: { name: string };
  departementAdministratif: string;
};

export const StructureCard = ({
  nom,
  codeBhasile,
  type,
  operateur,
  departementAdministratif,
}: Props) => {
  return (
    <div className="p-4 rounded-sm border flex gap-4 relative border-default-grey">
      <span className="fr-icon-community-line fr-icon--md text-title-blue-france" />
      <div>
        <strong className="uppercase font-bold text-title-blue-france">
          {nom}
        </strong>
        <div className="text-sm">
          {codeBhasile && `${codeBhasile} - `}
          {type}, {operateur.name}, {departementAdministratif}
        </div>
      </div>
    </div>
  );
};
