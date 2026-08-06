import { findStructuresByCurrentDnaCodes } from "@/app/api/dna-structures/dna-structure.repository";
import { getNow } from "@/app/utils/now.util";
import {
  PrismaClient,
  StructureType as DbStructureType,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { normalizeBhasileCode, parseDnaCodes } from "./transfo-huda-cada.util";

type StructureWithDnaCodes = Awaited<
  ReturnType<typeof findStructuresByCurrentDnaCodes>
>[number];

const HUDA_CADA_TRANSFORMATION_TYPES: TransformationType[] = [
  TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
  TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
];

export type StructureCandidate = {
  id: number;
  codeBhasile: string;
  type: DbStructureType | null;
  fermetureDate: Date | null;
  operateurId: number | null;
};

const hasExpectedType = (
  structure: StructureCandidate,
  expectedType: StructureType
): boolean => structure.type === expectedType;

const describeType = (structure: StructureCandidate): string =>
  structure.type ?? "type non renseigné";

const describeClosure = (structure: StructureCandidate): string | null =>
  structure.fermetureDate
    ? `${structure.codeBhasile} est fermé depuis le ${structure.fermetureDate.toLocaleDateString("fr-FR")}`
    : null;

export type ResolvedStructure = {
  structureId: number;
  codeBhasile: string;
  operateurId: number | null;
  via: "code-bhasile" | "codes-dna"; // Comment le rattachement a été obtenu
};

type ResolutionFailure = {
  reason: string;
};

export type Resolution<TValue> =
  { ok: true; value: TValue } | { ok: false; failure: ResolutionFailure };

const structureSelect = {
  id: true,
  codeBhasile: true,
  type: true,
  fermetureDate: true,
  operateurId: true,
} as const;

const checkStructure = (
  structure: StructureCandidate,
  expectedType: StructureType
): string | null => {
  const closure = describeClosure(structure);
  if (closure) {
    return closure;
  }
  if (!hasExpectedType(structure, expectedType)) {
    return `${structure.codeBhasile} n'est pas un ${expectedType} (${describeType(structure)})`;
  }
  return null;
};

const resolveStructuresByDnaCodes = async (
  rawValues: string[],
  departement: string | null,
  now: Date
): Promise<Resolution<StructureWithDnaCodes[]>> => {
  const { codes, padded, unreadable, outsideDepartement } = parseDnaCodes(
    rawValues,
    departement
  );

  const structures =
    codes.length > 0 || padded.size > 0
      ? await findStructuresByCurrentDnaCodes(
          [...codes, ...padded.values()],
          now
        )
      : [];
  const matched = new Set(structures.flatMap(({ dnaCodes }) => dnaCodes));

  const unknownCodes = [
    ...codes.filter((code) => !matched.has(code)),
    ...[...padded]
      .filter(([, candidate]) => !matched.has(candidate))
      .map(([code]) => code),
  ];

  const reason = describeUnusableCodes({
    unreadable,
    outsideDepartement,
    unknownCodes,
    departement,
  });
  return reason
    ? { ok: false, failure: { reason } }
    : { ok: true, value: structures };
};

const describeUnusableCodes = ({
  unreadable,
  outsideDepartement,
  unknownCodes,
  departement,
}: {
  unreadable: string[];
  outsideDepartement: string[];
  unknownCodes: string[];
  departement: string | null;
}): string | null => {
  const details = [
    unreadable.length > 0 ? `illisibles : ${unreadable.join(", ")}` : null,
    outsideDepartement.length > 0
      ? `hors département ${departement} : ${outsideDepartement.join(", ")}`
      : null,
    unknownCodes.length > 0
      ? `inconnus en base : ${unknownCodes.join(", ")}`
      : null,
  ].filter((detail) => detail !== null);

  return details.length > 0
    ? `codes DNA non exploitables — ${details.join(" ; ")}`
    : null;
};

type HudaEnvelopeInput = {
  rawBhasileCodes: string[];
  rawDnaCodes: string[];
  departement: string | null;
};

/* Aucune source ne prime : les codes Bhasile et les codes DNA s'additionnent */
export const resolveHudas = async (
  prisma: PrismaClient,
  { rawBhasileCodes, rawDnaCodes, departement }: HudaEnvelopeInput,
  now: Date = getNow()
): Promise<Resolution<ResolvedStructure[]>> => {
  const resolved = new Map<number, ResolvedStructure>();

  const bhasileCodes = [
    ...new Set(
      rawBhasileCodes
        .map((raw) => normalizeBhasileCode(raw))
        .filter((code) => code !== null)
    ),
  ];

  const structuresByCode = new Map(
    (bhasileCodes.length > 0
      ? await prisma.structure.findMany({
          where: { codeBhasile: { in: bhasileCodes } },
          select: structureSelect,
        })
      : []
    ).map((structure) => [structure.codeBhasile, structure])
  );

  for (const codeBhasile of bhasileCodes) {
    const structure = structuresByCode.get(codeBhasile);
    if (!structure) {
      return {
        ok: false,
        failure: { reason: `code Bhasile ${codeBhasile} inconnu en base` },
      };
    }
    const failureReason = checkStructure(structure, StructureType.HUDA);
    if (failureReason) {
      return { ok: false, failure: { reason: failureReason } };
    }
    resolved.set(structure.id, {
      structureId: structure.id,
      codeBhasile: structure.codeBhasile,
      operateurId: structure.operateurId,
      via: "code-bhasile",
    });
  }

  const byDnaCodes = await resolveStructuresByDnaCodes(
    rawDnaCodes,
    departement,
    now
  );
  if (!byDnaCodes.ok) {
    return byDnaCodes;
  }

  for (const structure of byDnaCodes.value) {
    const failureReason = checkStructure(structure, StructureType.HUDA);
    if (failureReason) {
      return {
        ok: false,
        failure: {
          reason: `rattaché via ${structure.dnaCodes.join(", ")} : ${failureReason}`,
        },
      };
    }
    if (!resolved.has(structure.id)) {
      resolved.set(structure.id, {
        structureId: structure.id,
        codeBhasile: structure.codeBhasile,
        operateurId: structure.operateurId,
        via: "codes-dna",
      });
    }
  }

  if (resolved.size === 0) {
    return {
      ok: false,
      failure: { reason: "ni code Bhasile ni code DNA exploitables" },
    };
  }

  return { ok: true, value: [...resolved.values()] };
};

type TargetCadaInput = {
  rawBhasileCode: string;
  rawDnaCodes: string[];
  departement: string | null;
};

/* Une extension n'a qu'une structure d'accueil. */
export const resolveTargetCada = async (
  prisma: PrismaClient,
  { rawBhasileCode, rawDnaCodes, departement }: TargetCadaInput,
  now: Date = getNow()
): Promise<Resolution<ResolvedStructure>> => {
  const codeBhasile = normalizeBhasileCode(rawBhasileCode);

  if (codeBhasile) {
    const structure = await prisma.structure.findUnique({
      where: { codeBhasile },
      select: structureSelect,
    });
    if (!structure) {
      return {
        ok: false,
        failure: { reason: `${codeBhasile} inconnu en base` },
      };
    }
    const failureReason = checkStructure(structure, StructureType.CADA);
    if (failureReason) {
      return { ok: false, failure: { reason: failureReason } };
    }
    return {
      ok: true,
      value: {
        structureId: structure.id,
        codeBhasile: structure.codeBhasile,
        operateurId: structure.operateurId,
        via: "code-bhasile",
      },
    };
  }

  const byDnaCodes = await resolveStructuresByDnaCodes(
    rawDnaCodes,
    departement,
    now
  );
  if (!byDnaCodes.ok) {
    return byDnaCodes;
  }
  const structures = byDnaCodes.value;
  if (structures.length === 0) {
    return {
      ok: false,
      failure: { reason: "code Bhasile absent ou illisible, aucun code DNA" },
    };
  }
  if (structures.length > 1) {
    return {
      ok: false,
      failure: {
        reason: `les codes DNA pointent vers ${structures.length} structures (${structures.map((structure) => structure.codeBhasile).join(", ")})`,
      },
    };
  }

  const [structure] = structures;
  const failureReason = checkStructure(structure, StructureType.CADA);
  if (failureReason) {
    return {
      ok: false,
      failure: {
        reason: `rattaché via ${structure.dnaCodes.join(", ")} : ${failureReason}`,
      },
    };
  }

  return {
    ok: true,
    value: {
      structureId: structure.id,
      codeBhasile: structure.codeBhasile,
      operateurId: structure.operateurId,
      via: "codes-dna",
    },
  };
};

export type ExistingHudaCadaTransformation = {
  id: number;
  numeroDossier: string | null;
  fermetureStructureIds: number[];
};

/* Un code Bhasile ne peut porter qu'une transfo HUDA>CADA à la fois */
export const findHudaCadaTransformations = async (
  prisma: PrismaClient,
  structureIds: number[]
): Promise<ExistingHudaCadaTransformation[]> => {
  const transformations = await prisma.transformation.findMany({
    where: {
      type: { in: HUDA_CADA_TRANSFORMATION_TYPES },
      structureVersionTransformations: {
        some: { structureVersion: { structureId: { in: structureIds } } },
      },
    },
    select: {
      id: true,
      numeroDossier: true,
      structureVersionTransformations: {
        where: { type: StructureVersionTransformationType.FERMETURE },
        select: { structureVersion: { select: { structureId: true } } },
      },
    },
  });

  return transformations.map(
    ({ id, numeroDossier, structureVersionTransformations }) => ({
      id,
      numeroDossier,
      fermetureStructureIds: structureVersionTransformations
        .map(({ structureVersion }) => structureVersion?.structureId)
        .filter(
          (structureId) => structureId !== null && structureId !== undefined
        ),
    })
  );
};

/* On ne touche jamais à une transfo qu'un agent a commencée, on lui rattache juste le numéro de dossier s'il porte exactement la même enveloppe. */
export const matchesEnvelope = (
  transformation: ExistingHudaCadaTransformation,
  structureIds: number[]
): boolean =>
  transformation.fermetureStructureIds.length === structureIds.length &&
  structureIds.every((structureId) =>
    transformation.fermetureStructureIds.includes(structureId)
  );
