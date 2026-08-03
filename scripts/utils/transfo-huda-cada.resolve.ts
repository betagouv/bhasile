import { findStructuresByCurrentDnaCodes } from "@/app/api/dna-structures/dna-structure.repository";
import { getNow } from "@/app/utils/now.util";
import { PrismaClient } from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

import {
  normalizeBhasileCode,
  normalizeDnaCodes,
} from "./transfo-huda-cada.util";

const HUDA_CADA_TRANSFORMATION_TYPES: TransformationType[] = [
  TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
  TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
];

export type StructureCandidate = {
  id: number;
  codeBhasile: string;
  type: string | null;
};

export const hasExpectedType = (
  structure: StructureCandidate,
  expectedType: StructureType
): boolean => structure.type === expectedType;

export const describeType = (structure: StructureCandidate): string =>
  structure.type ?? "type non renseigné";

export type ResolvedHuda = {
  structureId: number;
  codeBhasile: string;
  via: "code-bhasile" | "codes-dna"; // Comment le rattachement a été obtenu
};

export type ResolutionFailure = {
  reason: string;
};

export type HudaResolution =
  { ok: true; huda: ResolvedHuda } | { ok: false; failure: ResolutionFailure };

const structureSelect = {
  id: true,
  codeBhasile: true,
  type: true,
} as const;

/* Le code Bhasile manque sur une bonne partie des dossiers soumis, alors que les codes DNA résolvent bien. On tente donc le code Bhasile, puis fallback sur DNA */
export const resolveHuda = async (
  prisma: PrismaClient,
  rawBhasileCode: string,
  rawDnaCodes: string,
  now: Date = getNow()
): Promise<HudaResolution> => {
  const codeBhasile = normalizeBhasileCode(rawBhasileCode);

  if (codeBhasile) {
    const structure = await prisma.structure.findUnique({
      where: { codeBhasile },
      select: structureSelect,
    });
    if (structure) {
      return hasExpectedType(structure, StructureType.HUDA)
        ? {
            ok: true,
            huda: {
              structureId: structure.id,
              codeBhasile: structure.codeBhasile,
              via: "code-bhasile",
            },
          }
        : {
            ok: false,
            failure: {
              reason: `${structure.codeBhasile} n'est pas un HUDA (${describeType(structure)})`,
            },
          };
    }
  }

  const { codes } = normalizeDnaCodes(rawDnaCodes);
  if (codes.length === 0) {
    return {
      ok: false,
      failure: {
        reason: codeBhasile
          ? `code Bhasile ${codeBhasile} inconnu en base, et aucun code DNA exploitable`
          : `ni code Bhasile ni code DNA exploitables`,
      },
    };
  }

  const structures = await findStructuresByCurrentDnaCodes(codes, now);

  if (structures.length === 0) {
    return {
      ok: false,
      failure: {
        reason: `aucun code DNA connu en base parmi ${codes.join(", ")}`,
      },
    };
  }

  if (structures.length > 1) {
    return {
      ok: false,
      failure: {
        reason: `les codes DNA ${codes.join(", ")} pointent vers ${structures.length} structures différentes (${structures.map((structure) => structure.codeBhasile).join(", ")})`,
      },
    };
  }

  const [structure] = structures;
  if (!hasExpectedType(structure, StructureType.HUDA)) {
    return {
      ok: false,
      failure: {
        reason: `${structure.codeBhasile}, rattaché via ${codes.join(", ")}, n'est pas un HUDA (${describeType(structure)})`,
      },
    };
  }

  return {
    ok: true,
    huda: {
      structureId: structure.id,
      codeBhasile: structure.codeBhasile,
      via: "codes-dna",
    },
  };
};

/* Une transfo HUDA>CADA déjà ouverte sur cette structure prime, qu'elle vienne d'un agent ou d'un autre dossier Démarches Numériques : on ne veut pas en superposer une seconde. */
export const findExistingHudaCadaTransformation = async (
  prisma: PrismaClient,
  structureId: number
): Promise<{
  id: number;
  type: TransformationType;
  numeroDossier: string | null;
} | null> => {
  const transformation = await prisma.transformation.findFirst({
    where: {
      type: { in: HUDA_CADA_TRANSFORMATION_TYPES },
      structureVersionTransformations: {
        some: { structureVersion: { structureId } },
      },
    },
    select: { id: true, type: true, numeroDossier: true },
  });

  return transformation;
};
