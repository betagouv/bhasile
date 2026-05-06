import { useEffect } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { useStructureSelections } from "@/app/hooks/useStructureSelections";
import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export const StructureSelections = ({
  transformationType,
  structureId,
  onChange,
}: Props) => {
  const {
    blocks,
    selectedStructureIdsByBlock,
    filtersByBlock,
    setSelectedStructureIds,
    setOperateurName,
    setDepartementNumero,
    getInheritedOperateurName,
    getInheritedDepartementNumero,
    structureTransformations,
  } = useStructureSelections({ transformationType, structureId });

  useEffect(() => {
    onChange(structureTransformations);
  }, [structureTransformations, onChange]);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        const inheritedOperateur = getInheritedOperateurName(block);
        const inheritedDepartement = getInheritedDepartementNumero(block);

        if (block.inheritOperateurFrom && !inheritedOperateur) {
          return null;
        }
        if (block.inheritDepartementFrom && !inheritedDepartement) {
          return null;
        }

        return (
          <StructureSearch
            key={block.id}
            multiple={block.multiple}
            fixedType={block.fixedType}
            fixedOperateurName={inheritedOperateur}
            fixedDepartementNumero={inheritedDepartement}
            operateurName={filtersByBlock[block.id]?.operateurName}
            setOperateurName={(v) => setOperateurName(block.id, v)}
            departementNumero={filtersByBlock[block.id]?.departementNumero}
            setDepartementNumero={(v) => setDepartementNumero(block.id, v)}
            selectedStructureIds={selectedStructureIdsByBlock[block.id] ?? []}
            setSelectedStructuresId={(ids) =>
              setSelectedStructureIds(block.id, ids)
            }
          />
        );
      })}
    </div>
  );
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  onChange: (
    structureTransformations: StructureTransformationApiType[]
  ) => void;
};
