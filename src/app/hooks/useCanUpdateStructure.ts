"use client";

import { subject } from "@casl/ability";
import { useContext } from "react";

import { AbilityContext } from "@/app/context/AbilityContext";
import { StructureApiRead } from "@/schemas/api/structure.schema";

export const useCanUpdateStructure = (
  structure: StructureApiRead
): boolean => {
  const ability = useContext(AbilityContext);

  return ability.can("update", subject("Structure", structure));
};
