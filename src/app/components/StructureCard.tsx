import { StructureType } from "@/types/structure.type";

import { cn } from "../utils/classname.util";

export const StructureCard = ({
  nom,
  codeBhasile,
  type,
  operateur,
  departementAdministratif,
  className,
}: Props) => {
  return (
    <div
      className={cn(
        "p-4 rounded-sm border flex gap-4 relative border-default-grey",
        className
      )}
    >
      <span className="fr-icon-community-line fr-icon--md text-title-blue-france" />
      <div>
        {nom && (
          <strong className="uppercase font-bold text-title-blue-france">
            {nom}
          </strong>
        )}
        <div className="text-sm">
          {codeBhasile && `${codeBhasile} - `}
          {[type, operateur?.name, departementAdministratif]
            .filter(Boolean)
            .join(", ")}
        </div>
      </div>
    </div>
  );
};

type Props = {
  nom?: string | null;
  codeBhasile?: string;
  type?: StructureType;
  operateur?: { name: string };
  departementAdministratif?: string;
  className?: string;
};
