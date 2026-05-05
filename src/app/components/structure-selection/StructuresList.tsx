import { cn } from "@/app/utils/classname.util";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const StructuresList = ({
  structures,
  selectedStructureIds,
  setSelectedStructuresId,
  multiple = false,
}: Props) => {
  const toggleStructure = (structureId: number) => {
    if (multiple) {
      if (selectedStructureIds.includes(structureId)) {
        setSelectedStructuresId(
          selectedStructureIds.filter((id) => id !== structureId)
        );
      } else {
        setSelectedStructuresId([...selectedStructureIds, structureId]);
      }
      return;
    }

    if (selectedStructureIds.includes(structureId)) {
      setSelectedStructuresId([]);
    } else {
      setSelectedStructuresId([structureId]);
    }
  };

  return (
    <div>
      <h3 className="text-base font-bold mb-4 text-title-blue-france">
        {!structures ? "" : "Sélectionnez votre structure"}
      </h3>
      <div className="flex flex-col gap-2 h-80 overflow-y-auto">
        {structures && structures?.length === 0 && (
          <div className="text-sm text-default-grey">
            Aucun résultat ne correspond à votre recherche.
          </div>
        )}
        {structures?.map((structure) => {
          const checked = selectedStructureIds.includes(structure.id);
          const inputId = `structure-${structure.id}`;

          return (
            <div key={structure.id}>
              <input
                type="checkbox"
                id={inputId}
                name="structure-selection"
                value={structure.id}
                checked={checked}
                onChange={() => {
                  toggleStructure(structure.id);
                }}
                className="sr-only"
              />
              <label
                className={cn(
                  "p-4 rounded-sm border-2 flex gap-4 relative bg-default-grey-hover cursor-pointer",
                  checked ? "border-action-high-blue-france" : "border-white"
                )}
                htmlFor={inputId}
              >
                <span className="fr-icon-community-line fr-icon--md text-title-blue-france" />
                <div>
                  <strong className="uppercase font-bold text-title-blue-france">
                    {structure.nom}
                  </strong>
                  <div className="text-sm">
                    {structure.codeBhasile} - {structure.type},{" "}
                    {structure.operateur.name},{" "}
                    {structure.departementAdministratif}
                  </div>
                </div>
                {checked && (
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 fr-icon-check-line fr-icon--md text-title-blue-france" />
                )}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type Props = {
  structures: StructureMinimalApiType[] | undefined;
  selectedStructureIds: number[];
  setSelectedStructuresId: (structuresId: number[]) => void;
  multiple?: boolean;
};
