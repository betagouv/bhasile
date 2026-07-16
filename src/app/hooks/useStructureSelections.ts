import { useMemo, useRef, useState } from "react";

import {
  StructureSelectionBlock,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

type BlockFilters = {
  structureType?: StructureType;
  operateurName?: string;
  departementNumero?: string;
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  departureType?: StructureType;
  departureDepartement?: string;
};

export const useStructureSelections = ({
  transformationType,
  structureId,
  departureType,
  departureDepartement,
}: Props) => {
  const transformationSpec = TRANSFORMATION_TYPE_SPECS[transformationType];

  const [selectedStructureIdsByBlock, setSelectedStructureIdsByBlock] =
    useState<Record<string, number[]>>({});

  const [filtersByBlock, setFiltersByBlock] = useState<
    Record<string, BlockFilters>
  >({});

  const previousTransformationType = useRef(transformationType);
  if (previousTransformationType.current !== transformationType) {
    previousTransformationType.current = transformationType;
    setSelectedStructureIdsByBlock({});
    setFiltersByBlock({});
  }

  const resetDependentsOf = (
    sourceBlockId: string,
    field: "operateurName" | "departementNumero"
  ) => {
    const dependents = transformationSpec.blocks.filter((block) =>
      field === "operateurName"
        ? block.inheritOperateurFrom === sourceBlockId
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

  const setSelectedStructureIds = (blockId: string, ids: number[]) =>
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

  const setStructureType = (
    blockId: string,
    structureType: StructureType | undefined
  ) => {
    setFiltersByBlock((prevFiltersByBlock) => ({
      ...prevFiltersByBlock,
      [blockId]: { ...prevFiltersByBlock[blockId], structureType },
    }));
  };

  const getFixedType = (
    block: StructureSelectionBlock
  ): StructureType | undefined =>
    block.fixedType ?? (block.matchDepartureType ? departureType : undefined);

  const getFixedDepartement = (
    block: StructureSelectionBlock
  ): string | undefined =>
    block.matchDepartureDepartement ? departureDepartement : undefined;

  const getEffectiveStructureType = (
    block: StructureSelectionBlock
  ): StructureType | undefined =>
    getFixedType(block) ?? filtersByBlock[block.id]?.structureType;

  const getInheritedOperateurName = (
    block: StructureSelectionBlock
  ): string | undefined =>
    block.inheritOperateurFrom
      ? filtersByBlock[block.inheritOperateurFrom]?.operateurName
      : undefined;

  const getInheritedDepartementNumero = (
    block: StructureSelectionBlock
  ): string | undefined =>
    block.inheritDepartementFrom
      ? filtersByBlock[block.inheritDepartementFrom]?.departementNumero
      : undefined;

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
  };
};
