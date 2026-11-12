"use client";

import { subject } from "@casl/ability";
import { useAbility } from "@casl/react";

import {
  type AppAbility,
  canAbilityReadStructure,
  type StructureScope,
} from "@/lib/casl";
import { StructureApiRead } from "@/schemas/api/structure.schema";

export const useCanUpdateStructure = (structure: StructureApiRead): boolean => {
  const ability = useAbility();

  return ability.can("update", subject("Structure", structure));
};

export const useCanUpdateStructures = (): ((structure: {
  id: number;
  departementAdministratif?: string;
}) => boolean) => {
  const ability = useAbility();

  return ({ id, departementAdministratif }) =>
    ability.can(
      "update",
      subject("Structure", { id, departementAdministratif } as StructureApiRead)
    );
};

export const useCanReadStructures = (): ((
  structure: StructureScope
) => boolean) => {
  const ability = useAbility<AppAbility>();

  return (structure) => canAbilityReadStructure(ability, structure);
};
