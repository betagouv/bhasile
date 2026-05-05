"use client";

import { useState } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { StructureType } from "@/types/structure.type";

export default function TransformationSelectionPage() {
  const [selectedStructuresId, setSelectedStructuresId] = useState<number[]>(
    []
  );
  return (
    <div>
      <StructureSearch
        selectedStructuresId={selectedStructuresId}
        setSelectedStructuresId={setSelectedStructuresId}
        fixedType={StructureType.HUDA}
        multiple
      />
    </div>
  );
}
