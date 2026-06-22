"use client";

import { subject } from "@casl/ability";
import { useAbility } from "@casl/react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

export const useCanUpdateStructure = (structure: StructureApiRead): boolean => {
  const ability = useAbility();

  return ability.can("update", subject("Structure", structure));
};
