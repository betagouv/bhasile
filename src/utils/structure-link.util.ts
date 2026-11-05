import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { StructurePermissionSubject } from "@/types/structure.type";

type StructureStatus = {
  id: number;
  isFinalised: boolean;
  isClosed?: boolean;
};

export type CpomLinkedStructure = NonNullable<
  NonNullable<CpomApiRead["structures"]>[number]["structure"]
>;

type CanOnStructure = (structure: StructurePermissionSubject) => boolean;

type CpomStructureAction =
  | { kind: "fiche" | "finalisation"; href: string; title: string }
  | { kind: "finalisationForbidden"; title: string };

export const hasStructureFiche = ({
  isFinalised,
  isClosed = false,
}: Omit<StructureStatus, "id">): boolean => isFinalised || isClosed;

export const getStructureHref = (structure: StructureStatus): string =>
  hasStructureFiche(structure)
    ? `/structures/${structure.id}`
    : `/structures/${structure.id}/finalisation/01-identification`;

export const getCpomStructureAction = (
  structure: CpomLinkedStructure,
  {
    canReadStructure,
    canUpdateStructure,
  }: { canReadStructure: CanOnStructure; canUpdateStructure: CanOnStructure }
): CpomStructureAction | null => {
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
      ? { kind: "fiche", href, title: `Voir la structure ${codeBhasile}` }
      : null;
  }
  if (!structure.isVisible) {
    return null;
  }
  const title = `Finaliser la création de la structure ${codeBhasile}`;
  return canUpdateStructure(permissionSubject)
    ? { kind: "finalisation", href, title }
    : { kind: "finalisationForbidden", title };
};
