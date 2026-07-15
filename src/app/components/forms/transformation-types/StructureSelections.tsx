import { useEffect } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { useStructureSelections } from "@/app/hooks/useStructureSelections";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

export const StructureSelections = ({
  transformationType,
  structureId,
  departureType,
  departureDepartement,
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
    getFixedType,
    getFixedDepartement,
    getEffectiveStructureType,
    getInheritedOperateurName,
    getInheritedDepartementNumero,
    structureVersionTransformations,
    areSelectionsComplete,
  } = useStructureSelections({
    transformationType,
    structureId,
    departureType,
    departureDepartement,
  });

  useEffect(() => {
    onChange({ structureVersionTransformations, areSelectionsComplete });
  }, [structureVersionTransformations, areSelectionsComplete, onChange]);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        const inheritedOperateur = getInheritedOperateurName(block);
        const inheritedDepartement = getInheritedDepartementNumero(block);
        const fixedDepartement =
          inheritedDepartement ?? getFixedDepartement(block);

        if (block.inheritOperateurFrom && !inheritedOperateur) {
          return null;
        }
        if (block.inheritDepartementFrom && !inheritedDepartement) {
          return null;
        }
        if (block.matchDepartureDepartement && !departureDepartement) {
          return null;
        }

        return (
          <StructureSearch
            key={block.id}
            multiple={block.multiple}
            fixedType={getFixedType(block)}
            finalisedOnly
            label={block.label}
            structureType={getEffectiveStructureType(block)}
            setStructureType={(v) => setStructureType(block.id, v)}
            fixedOperateurName={inheritedOperateur}
            fixedDepartementNumero={fixedDepartement}
            operateurName={filtersByBlock[block.id]?.operateurName}
            setOperateurName={(v) => setOperateurName(block.id, v)}
            departementNumero={filtersByBlock[block.id]?.departementNumero}
            setDepartementNumero={(v) => setDepartementNumero(block.id, v)}
            selectedStructureIds={selectedStructureIdsByBlock[block.id] ?? []}
            setSelectedStructureIds={(ids) =>
              setSelectedStructureIds(block.id, ids)
            }
            excludedStructureId={structureId}
          />
        );
      })}
    </div>
  );
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  departureType?: StructureType;
  departureDepartement?: string;
  onChange: (state: {
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
    areSelectionsComplete: boolean;
  }) => void;
};
