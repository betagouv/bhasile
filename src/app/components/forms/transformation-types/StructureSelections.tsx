import { useEffect } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { useStructureSelections } from "@/app/hooks/useStructureSelections";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
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
    setStructureType,
    getEffectiveStructureType,
    getInheritedOperateurName,
    getInheritedDepartementNumero,
    structureVersionTransformations,
    areSelectionsComplete,
  } = useStructureSelections({ transformationType, structureId });

  useEffect(() => {
    onChange({ structureVersionTransformations, areSelectionsComplete });
  }, [structureVersionTransformations, areSelectionsComplete, onChange]);

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
            finalisedOnly
            label={block.label}
            structureType={getEffectiveStructureType(block)}
            setStructureType={(v) => setStructureType(block.id, v)}
            fixedOperateurName={inheritedOperateur}
            fixedDepartementNumero={inheritedDepartement}
            operateurName={filtersByBlock[block.id]?.operateurName}
            setOperateurName={(v) => setOperateurName(block.id, v)}
            departementNumero={filtersByBlock[block.id]?.departementNumero}
            setDepartementNumero={(v) => setDepartementNumero(block.id, v)}
            selectedStructureIds={selectedStructureIdsByBlock[block.id] ?? []}
            setSelectedStructureIds={(ids) =>
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
  onChange: (state: {
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
    areSelectionsComplete: boolean;
  }) => void;
};
