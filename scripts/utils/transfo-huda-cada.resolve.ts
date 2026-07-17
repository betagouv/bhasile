import { PrismaClient } from "@/generated/prisma/client";
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

/* Le code Bhasile manque sur une bonne partie des dossiers soumis, alors que les codes DNA résolvent bien. On tente donc le code Bhasile, puis fallback sur DNA */
export const resolveHuda = async (
  prisma: PrismaClient,
  rawBhasileCode: string,
  rawDnaCodes: string
): Promise<HudaResolution> => {
  const codeBhasile = normalizeBhasileCode(rawBhasileCode);

  if (codeBhasile) {
    const structure = await prisma.structure.findUnique({
      where: { codeBhasile },
      select: { id: true, codeBhasile: true },
    });
    if (structure) {
      return {
        ok: true,
        huda: {
          structureId: structure.id,
          codeBhasile: structure.codeBhasile,
          via: "code-bhasile",
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

  const dnaStructures = await prisma.dnaStructure.findMany({
    where: { dna: { code: { in: codes } }, structureId: { not: null } },
    select: { structure: { select: { id: true, codeBhasile: true } } },
  });

  const structures = [
    ...new Map(
      dnaStructures
        .map((dnaStructure) => dnaStructure.structure)
        .filter((structure) => structure !== null)
        .map((structure) => [structure.id, structure])
    ).values(),
  ];

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
        reason: `les codes DNA ${codes.join(", ")} pointent vers ${structures.length} structures différentes (${structures.map((s) => s.codeBhasile).join(", ")})`,
      },
    };
  }

  return {
    ok: true,
    huda: {
      structureId: structures[0].id,
      codeBhasile: structures[0].codeBhasile,
      via: "codes-dna",
    },
  };
};

/* Une transfo HUDA>CADA déjà initiée par un agent sur cette structure prime : on ne veut pas lui en superposer une seconde issue de Démarches Numériques. */
export const findAgentTransformation = async (
  prisma: PrismaClient,
  structureId: number
): Promise<{ id: number; type: TransformationType } | null> => {
  const transformation = await prisma.transformation.findFirst({
    where: {
      source: "AGENT",
      type: { in: HUDA_CADA_TRANSFORMATION_TYPES },
      structureVersionTransformations: {
        some: { structureVersion: { structureId } },
      },
    },
    select: { id: true, type: true },
  });

  return transformation;
};
