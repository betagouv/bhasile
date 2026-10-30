import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { StructurePermissionSubject } from "@/types/structure.type";

type StructureStatus = {
  id: number;
  isFinalised: boolean;
  isClosed?: boolean;
};

type CpomLinkedStructure = NonNullable<
  NonNullable<CpomApiRead["structures"]>[number]["structure"]
>;

type CanOnStructure = (structure: StructurePermissionSubject) => boolean;

export const hasStructureFiche = ({
  isFinalised,
  isClosed = false,
}: Omit<StructureStatus, "id">): boolean => isFinalised || isClosed;

export const getStructureHref = (structure: StructureStatus): string =>
  hasStructureFiche(structure)
    ? `/structures/${structure.id}`
    : `/structures/${structure.id}/finalisation/01-identification`;

export const getCpomStructureLink = (
  structure: CpomLinkedStructure,
  {
    canReadStructure,
    canUpdateStructure,
  }: { canReadStructure: CanOnStructure; canUpdateStructure: CanOnStructure }
): { href: string; title: string; isFinalisation: boolean } | null => {
  const { id, codeBhasile, isFinalised, isClosed } = structure;
  if (!id) {
    return null;
  }
  const permissionSubject = {
    id,
    departementAdministratif: structure.departementAdministratif,
    operateurId: structure.operateur?.id,
  };
  const href = getStructureHref({ id, isFinalised, isClosed });
  if (hasStructureFiche(structure)) {
    return canReadStructure(permissionSubject)
      ? {
          href,
          title: `Voir la structure ${codeBhasile}`,
          isFinalisation: false,
        }
      : null;
  }
  if (structure.isVisible && canUpdateStructure(permissionSubject)) {
    return {
      href,
      title: `Finaliser la création de la structure ${codeBhasile}`,
      isFinalisation: true,
    };
  }
  return null;
};
