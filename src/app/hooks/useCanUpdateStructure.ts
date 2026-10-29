"use client";

import { subject } from "@casl/ability";
import { useAbility } from "@casl/react";

import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructurePermissionSubject } from "@/types/structure.type";

export const useCanUpdateStructure = (structure: StructureApiRead): boolean => {
  const ability = useAbility();

  return ability.can("update", subject("Structure", structure));
};

export const useCanUpdateStructures = (): ((
  structure: StructurePermissionSubject
) => boolean) => useCanOnStructures("update");

export const useCanReadStructures = (): ((
  structure: StructurePermissionSubject
) => boolean) => useCanOnStructures("read");

const useCanOnStructures = (
  action: "read" | "update"
): ((structure: StructurePermissionSubject) => boolean) => {
  const ability = useAbility();

  return (structure) =>
    ability.can(action, subject("Structure", structure as StructureApiRead));
};
