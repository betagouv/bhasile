import { CpomApiRead } from "@/schemas/api/cpom.schema";

type StructureStatus = {
  id: number;
  isFinalised: boolean;
  isClosed?: boolean;
};

export type CpomLinkedStructure = NonNullable<
  NonNullable<CpomApiRead["structures"]>[number]["structure"]
>;

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
  structure: CpomLinkedStructure
): CpomStructureAction | null => {
  const { id, codeBhasile, isFinalised, isClosed, canRead, canUpdate } =
    structure;
  if (!id) {
    return null;
  }
  const href = getStructureHref({ id, isFinalised, isClosed });
  if (hasStructureFiche(structure)) {
    return canRead
      ? { kind: "fiche", href, title: `Voir la structure ${codeBhasile}` }
      : null;
  }
  if (!structure.isVisible) {
    return null;
  }
  const title = `Finaliser la création de la structure ${codeBhasile}`;
  return canUpdate
    ? { kind: "finalisation", href, title }
    : { kind: "finalisationForbidden", title };
};
