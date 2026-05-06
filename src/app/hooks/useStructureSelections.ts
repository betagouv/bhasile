import { useEffect, useMemo, useRef, useState } from "react";

import {
  StructureSelectionBlock,
  TRANSFORMATION_TYPE_SPECS,
} from "@/app/utils/transformation.util";
import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

type BlockFilters = {
  operateurName?: string;
  departementNumero?: string;
};

type Args = {
  transformationType: TransformationType;
  structureId?: number;
};

export const useStructureSelections = ({
  transformationType,
  structureId,
}: Args) => {
  const transformationSpec = TRANSFORMATION_TYPE_SPECS[transformationType];

  const [selectedStructureIdsByBlock, setSelectedStructureIdsByBlock] =
    useState<Record<string, number[]>>({});

  const [filtersByBlock, setFiltersByBlock] = useState<
    Record<string, BlockFilters>
  >({});

  const previousTransformationType = useRef(transformationType);
  useEffect(() => {
    if (previousTransformationType.current !== transformationType) {
      previousTransformationType.current = transformationType;
      setSelectedStructureIdsByBlock({});
      setFiltersByBlock({});
    }
  }, [transformationType]);

  const resetDependentsOf = (
    sourceBlockId: string,
    field: "operateurName" | "departementNumero"
  ) => {
    const dependents = transformationSpec.blocks.filter((block) =>
      field === "operateurName"
        ? block.inheritOperatorFrom === sourceBlockId
        : block.inheritDepartementFrom === sourceBlockId
    );
    if (dependents.length === 0) {
      return;
    }

    setSelectedStructureIdsByBlock((prevSelectedStructureIdsByBlock) => {
      const newSelectedStructureIdsByBlock = {
        ...prevSelectedStructureIdsByBlock,
      };
      for (const dependent of dependents) {
        newSelectedStructureIdsByBlock[dependent.id] = [];
      }
      return newSelectedStructureIdsByBlock;
    });

    setFiltersByBlock((prevFiltersByBlock) => {
      const newFiltersByBlock = { ...prevFiltersByBlock };
      for (const dependent of dependents) {
        newFiltersByBlock[dependent.id] = {};
      }
      return newFiltersByBlock;
    });
  };

  const setSelection = (blockId: string, ids: number[]) =>
    setSelectedStructureIdsByBlock((prevSelectedStructureIdsByBlock) => ({
      ...prevSelectedStructureIdsByBlock,
      [blockId]: ids,
    }));

  const setOperateurName = (
    blockId: string,
    operateurName: string | undefined
  ) => {
    setFiltersByBlock((prevFiltersByBlock) => ({
      ...prevFiltersByBlock,
      [blockId]: { ...prevFiltersByBlock[blockId], operateurName },
    }));
    resetDependentsOf(blockId, "operateurName");
  };

  const setDepartementNumero = (
    blockId: string,
    departementNumero: string | undefined
  ) => {
    setFiltersByBlock((prevFiltersByBlock) => ({
      ...prevFiltersByBlock,
      [blockId]: { ...prevFiltersByBlock[blockId], departementNumero },
    }));
    resetDependentsOf(blockId, "departementNumero");
  };

  const getInheritedOperatorName = (
    block: StructureSelectionBlock
  ): string | undefined =>
    block.inheritOperatorFrom
      ? filtersByBlock[block.inheritOperatorFrom]?.operateurName
      : undefined;

  const getInheritedDepartementNumero = (
    block: StructureSelectionBlock
  ): string | undefined =>
    block.inheritDepartementFrom
      ? filtersByBlock[block.inheritDepartementFrom]?.departementNumero
      : undefined;

  const structureTransformations = useMemo<StructureTransformationApiType[]>(
    () => [
      ...transformationSpec.buildAutoTransformations(structureId),
      ...transformationSpec.blocks.flatMap((block) =>
        (selectedStructureIdsByBlock[block.id] ?? []).map((id) => ({
          structureId: id,
          type: block.type,
        }))
      ),
    ],
    [transformationSpec, structureId, selectedStructureIdsByBlock]
  );

  return {
    blocks: transformationSpec.blocks,
    selectedStructureIdsByBlock,
    filtersByBlock,
    setSelection,
    setOperateurName,
    setDepartementNumero,
    getInheritedOperatorName,
    getInheritedDepartementNumero,
    structureTransformations,
  };
};
