"use client";

import { subject } from "@casl/ability";
import { useAbility } from "@casl/react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

export const useCanUpdateStructure = (structure: StructureApiRead): boolean => {
  const ability = useAbility();

  return ability.can("update", subject("Structure", structure));
};

export const useCanUpdateDepartement = (): ((
  departementAdministratif?: string
) => boolean) => {
  const ability = useAbility();

  return (departementAdministratif) =>
    ability.can(
      "update",
      subject("Structure", { departementAdministratif } as StructureApiRead)
    );
};
