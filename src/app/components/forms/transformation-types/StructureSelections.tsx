import { useEffect } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import {
  BlockFilters,
  useStructureSelections,
} from "@/app/hooks/useStructureSelections";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export const StructureSelections = ({
  transformationType,
  structureId,
  defaultFilters,
  onChange,
}: Props) => {
  const {
    blocks,
    selectedStructureIdsByBlock,
    getFilters,
    setSelectedStructureIds,
    setFilter,
    getEffectiveStructureType,
    structureVersionTransformations,
    areSelectionsComplete,
  } = useStructureSelections({
    transformationType,
    structureId,
    defaultFilters,
  });

  useEffect(() => {
    onChange({ structureVersionTransformations, areSelectionsComplete });
  }, [structureVersionTransformations, areSelectionsComplete, onChange]);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <StructureSearch
          key={`${transformationType}-${block.id}`}
          idPrefix={block.id}
          multiple={block.multiple}
          fixedType={block.fixedType}
          finalisedOnly
          label={block.label}
          structureType={getEffectiveStructureType(block)}
          setStructureType={(structureType) =>
            setFilter(block.id, "structureType", structureType)
          }
          operateurName={getFilters(block.id).operateurName}
          setOperateurName={(operateurName) =>
            setFilter(block.id, "operateurName", operateurName)
          }
          departementNumero={getFilters(block.id).departementNumero}
          setDepartementNumero={(departementNumero) =>
            setFilter(block.id, "departementNumero", departementNumero)
          }
          selectedStructureIds={selectedStructureIdsByBlock[block.id] ?? []}
          setSelectedStructureIds={(ids) =>
            setSelectedStructureIds(block.id, ids)
          }
          excludedStructureId={structureId}
        />
      ))}
    </div>
  );
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  defaultFilters?: BlockFilters;
  onChange: (state: {
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
    areSelectionsComplete: boolean;
  }) => void;
};
