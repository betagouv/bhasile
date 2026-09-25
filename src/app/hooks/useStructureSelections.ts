import { useMemo, useState } from "react";

import {
  StructureSelectionBlock,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

export type BlockFilters = {
  structureType?: StructureType;
  operateurName?: string;
  departementNumero?: string;
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  defaultFilters?: BlockFilters;
};

export const useStructureSelections = ({
  transformationType,
  structureId,
  defaultFilters,
}: Props) => {
  const transformationSpec = TRANSFORMATION_TYPE_SPECS[transformationType];

  const [selectedStructureIdsByBlock, setSelectedStructureIdsByBlock] =
    useState<Record<string, number[]>>({});

  const [filtersByBlock, setFiltersByBlock] = useState<
    Record<string, BlockFilters>
  >(() => buildDefaultFiltersByBlock(transformationType, defaultFilters));

  const [previousTransformationType, setPreviousTransformationType] =
    useState(transformationType);
  if (previousTransformationType !== transformationType) {
    setPreviousTransformationType(transformationType);
    setSelectedStructureIdsByBlock({});
    setFiltersByBlock(
      buildDefaultFiltersByBlock(transformationType, defaultFilters)
    );
  }

  const setSelectedStructureIds = (blockId: string, ids: number[]) =>
    setSelectedStructureIdsByBlock((prevSelectedStructureIdsByBlock) => ({
      ...prevSelectedStructureIdsByBlock,
      [blockId]: ids,
    }));

  const setFilter = <TField extends keyof BlockFilters>(
    blockId: string,
    field: TField,
    value: BlockFilters[TField]
  ) =>
    setFiltersByBlock((prevFiltersByBlock) => ({
      ...prevFiltersByBlock,
      [blockId]: { ...prevFiltersByBlock[blockId], [field]: value },
    }));

  const getEffectiveStructureType = (
    block: StructureSelectionBlock
  ): StructureType | undefined =>
    block.fixedType ?? filtersByBlock[block.id]?.structureType;

  const structureVersionTransformations = useMemo<StructureVersionTransformationApiCreate[]>(
    () => [
      ...transformationSpec.buildAutoTransformations(structureId),
      ...transformationSpec.blocks.flatMap((block) =>
        (selectedStructureIdsByBlock[block.id] ?? []).map((id) => ({
          type: block.type,
          structureType: block.fixedType,
          structureVersion: { structureId: id },
        }))
      ),
    ],
    [transformationSpec, structureId, selectedStructureIdsByBlock]
  );

  const areSelectionsComplete = useMemo<boolean>(
    () =>
      transformationSpec.blocks.every(
        (block) => (selectedStructureIdsByBlock[block.id] ?? []).length > 0
      ),
    [transformationSpec, selectedStructureIdsByBlock]
  );

  return {
    blocks: transformationSpec.blocks,
    selectedStructureIdsByBlock,
    filtersByBlock,
    setSelectedStructureIds,
    setFilter,
    getEffectiveStructureType,
    structureVersionTransformations,
    areSelectionsComplete,
  };
};

const buildDefaultFiltersByBlock = (
  transformationType: TransformationType,
  defaultFilters: BlockFilters | undefined
): Record<string, BlockFilters> =>
  Object.fromEntries(
    TRANSFORMATION_TYPE_SPECS[transformationType].blocks.map((block) => [
      block.id,
      defaultFilters ?? {},
    ])
  );
