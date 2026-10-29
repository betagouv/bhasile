import { CpomApiRead } from "@/schemas/api/cpom.schema";

type CpomLinkedStructure = NonNullable<
  NonNullable<CpomApiRead["structures"]>[number]["structure"]
>;

type CanUpdateStructure = (structure: {
  id: number;
  departementAdministratif?: string;
}) => boolean;

export const getCpomStructureLink = (
  structure: CpomLinkedStructure,
  canUpdateStructure: CanUpdateStructure
): { href: string; title: string } | null => {
  const { id, codeBhasile, departementAdministratif } = structure;
  if (!id) {
    return null;
  }
  if (structure.isClosed || structure.isFinalised) {
    return {
      href: `/structures/${id}`,
      title: `Voir la structure ${codeBhasile}`,
    };
  }
  if (
    structure.isVisible &&
    canUpdateStructure({ id, departementAdministratif })
  ) {
    return {
      href: `/structures/${id}/finalisation/01-identification`,
      title: `Finaliser la création de la structure ${codeBhasile}`,
    };
  }
  return null;
};
