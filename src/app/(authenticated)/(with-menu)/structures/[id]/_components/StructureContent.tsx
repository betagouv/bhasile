"use client";

import { StructureType } from "@/types/structure.type";

import { useStructureContext } from "../_context/StructureClientContext";
import { PrahdaStructure } from "./PrahdaStructure";
import { Structure } from "./Structure";

export default function StructureContent() {
  const { structure } = useStructureContext();
  const StructureComponent =
    structure.type === StructureType.PRAHDA ? PrahdaStructure : Structure;
  return <StructureComponent />;
}
