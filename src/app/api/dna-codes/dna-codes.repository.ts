import { DomainError } from "@/app/utils/domain-error.util";
import { Dna, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { FreeDnaCode } from "@/types/dna.type";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";
import { StructureType } from "@/types/structure.type";

export const findAll = async ({
  entityId = {},
  operateurId,
  departementAdministratif,
  type,
  transformationId,
}: {
  entityId?: EntityId;
  operateurId?: number;
  departementAdministratif?: string;
  type?: StructureType;
  transformationId?: number;
} = {}): Promise<FreeDnaCode[]> => {
  const { structureId, structureVersionId } = entityId;

  // Opérateur, département et type ne restreignent que les codes libres : le référentiel OFII peut décrire
  // un code déjà détenu avec ses anciennes valeurs (transfert en transformation), il doit rester proposé.
  const freeFilter: Prisma.DnaWhereInput = { dnaStructures: { none: {} } };
  if (operateurId) {
    freeFilter.operateur = {
      OR: [
        { id: operateurId },
        { parentId: operateurId },
        { filiales: { some: { id: operateurId } } },
      ],
    };
  }
  if (departementAdministratif) {
    freeFilter.departementAdministratif = departementAdministratif;
  }
  if (type) {
    freeFilter.type = type;
  }

  const ownershipFilters: Prisma.DnaWhereInput[] = [freeFilter];
  if (structureId) {
    ownershipFilters.push({
      dnaStructures: { some: { structureVersion: { structureId } } },
    });
  }
  if (structureVersionId) {
    ownershipFilters.push({
      dnaStructures: { some: { structureVersionId } },
    });
  }
  if (transformationId) {
    ownershipFilters.push({
      dnaStructures: {
        some: {
          structureVersion: {
            structureVersionTransformation: { transformationId },
          },
        },
      },
    });
  }

  return prisma.dna.findMany({
    where: { OR: ownershipFilters },
    select: { code: true, departementAdministratif: true },
  });
};

// Un DNA n'existe que via l'import du référentiel OFII : on résout le code existant, on n'en crée jamais.
export const resolveDnaByCode = async (
  tx: PrismaTransaction,
  dna: { code?: string | null } | undefined | null
): Promise<Dna | null> => {
  const normalizedCode = dna?.code?.trim();
  if (!normalizedCode) {
    return null;
  }

  const existing = await tx.dna.findUnique({
    where: { code: normalizedCode },
  });
  if (!existing) {
    throw new DomainError(
      `Code DNA inconnu du référentiel : ${normalizedCode}. Un DNA ne peut être créé que par l'import du référentiel OFII.`
    );
  }
  return existing;
};
