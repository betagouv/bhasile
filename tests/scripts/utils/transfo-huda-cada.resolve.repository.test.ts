import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  findExistingHudaCadaTransformation,
  resolveHuda,
} from "../../../scripts/utils/transfo-huda-cada.resolve";

const CODE_BHASILE_PREFIX = "BHA-HC-TEST-";

describe("transfo-huda-cada.resolve db integration", () => {
  const now = new Date("2026-07-01T00:00:00.000Z");
  const createdTransformationIds: number[] = [];
  const createdDnaIds: number[] = [];

  const createStructure = async (type: StructureType | null) => {
    const structure = await prisma.structure.create({
      data: { codeBhasile: `${CODE_BHASILE_PREFIX}${randomUUID()}`, type },
    });
    return structure;
  };

  const createVersion = async (structureId: number, effectiveDate: Date) => {
    return prisma.structureVersion.create({
      data: { structureId, effectiveDate },
    });
  };

  /* Le format DNA attendu par le parseur est contraint ([A-Z]\d{4}), et la base peut déjà contenir le code tiré */
  const createDna = async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(
        Math.floor(Math.random() * 10000)
      ).padStart(4, "0")}`;
      if (await prisma.dna.findUnique({ where: { code } })) {
        continue;
      }
      const dna = await prisma.dna.create({ data: { code } });
      createdDnaIds.push(dna.id);
      return dna;
    }
    throw new Error("Impossible de générer un code DNA libre");
  };

  const linkDnaToVersion = async (
    structureVersionId: number,
    dnaId: number
  ) => {
    await prisma.dnaStructure.create({ data: { structureVersionId, dnaId } });
  };

  const createDnaOnVersion = async (structureVersionId: number) => {
    const dna = await createDna();
    await linkDnaToVersion(structureVersionId, dna.id);
    return dna;
  };

  afterAll(async () => {
    if (createdTransformationIds.length > 0) {
      await prisma.structureVersionTransformation.deleteMany({
        where: { transformationId: { in: createdTransformationIds } },
      });
      await prisma.transformation.deleteMany({
        where: { id: { in: createdTransformationIds } },
      });
    }
    await prisma.dnaStructure.deleteMany({
      where: { dnaId: { in: createdDnaIds } },
    });
    await prisma.dna.deleteMany({ where: { id: { in: createdDnaIds } } });
    await prisma.structure.deleteMany({
      where: { codeBhasile: { startsWith: CODE_BHASILE_PREFIX } },
    });
  });

  describe("resolveHuda", () => {
    it("rattache le HUDA par son code Bhasile", async () => {
      const structure = await createStructure(StructureType.HUDA);

      const resolution = await resolveHuda(
        prisma,
        structure.codeBhasile,
        "",
        now
      );

      expect(resolution).toEqual({
        ok: true,
        huda: {
          structureId: structure.id,
          codeBhasile: structure.codeBhasile,
          via: "code-bhasile",
        },
      });
    });

    it("rejette une structure dont le type n'est pas HUDA", async () => {
      const structure = await createStructure(StructureType.CADA);

      const resolution = await resolveHuda(
        prisma,
        structure.codeBhasile,
        "",
        now
      );

      expect(resolution.ok).toBe(false);
      expect(resolution.ok === false && resolution.failure.reason).toContain(
        "n'est pas un HUDA"
      );
    });

    it("rejette une structure dont le type n'est pas renseigné", async () => {
      const structure = await createStructure(null);

      const resolution = await resolveHuda(
        prisma,
        structure.codeBhasile,
        "",
        now
      );

      expect(resolution.ok).toBe(false);
      expect(resolution.ok === false && resolution.failure.reason).toContain(
        "type non renseigné"
      );
    });

    it("rattache le HUDA par ses codes DNA quand le code Bhasile est illisible", async () => {
      const structure = await createStructure(StructureType.HUDA);
      const version = await createVersion(
        structure.id,
        new Date("2026-01-01T00:00:00.000Z")
      );
      const dna = await createDnaOnVersion(version.id);

      const resolution = await resolveHuda(prisma, "Multi DNA", dna.code, now);

      expect(resolution).toEqual({
        ok: true,
        huda: {
          structureId: structure.id,
          codeBhasile: structure.codeBhasile,
          via: "codes-dna",
        },
      });
    });

    it("ignore un rattachement porté par une version que la version courante ne reprend pas", async () => {
      const ancienHuda = await createStructure(StructureType.HUDA);
      const nouveauHuda = await createStructure(StructureType.HUDA);

      const ancienneVersion = await createVersion(
        ancienHuda.id,
        new Date("2024-01-01T00:00:00.000Z")
      );
      const dna = await createDnaOnVersion(ancienneVersion.id);
      await createVersion(ancienHuda.id, new Date("2026-01-01T00:00:00.000Z"));

      const nouvelleVersion = await createVersion(
        nouveauHuda.id,
        new Date("2026-01-01T00:00:00.000Z")
      );
      await linkDnaToVersion(nouvelleVersion.id, dna.id);

      const resolution = await resolveHuda(prisma, "", dna.code, now);

      expect(resolution.ok && resolution.huda.structureId).toBe(nouveauHuda.id);
    });

    it("ignore une version qui n'a pas encore pris effet", async () => {
      const huda = await createStructure(StructureType.HUDA);
      const versionFuture = await createVersion(
        huda.id,
        new Date("2027-01-01T00:00:00.000Z")
      );
      const dna = await createDnaOnVersion(versionFuture.id);

      const resolution = await resolveHuda(prisma, "", dna.code, now);

      expect(resolution.ok).toBe(false);
      expect(resolution.ok === false && resolution.failure.reason).toContain(
        "aucun code DNA connu en base"
      );
    });

    it("rejette des codes DNA qui pointent vers plusieurs structures", async () => {
      const premierHuda = await createStructure(StructureType.HUDA);
      const secondHuda = await createStructure(StructureType.HUDA);
      const premiereVersion = await createVersion(
        premierHuda.id,
        new Date("2026-01-01T00:00:00.000Z")
      );
      const secondeVersion = await createVersion(
        secondHuda.id,
        new Date("2026-01-01T00:00:00.000Z")
      );
      const premierDna = await createDnaOnVersion(premiereVersion.id);
      const secondDna = await createDnaOnVersion(secondeVersion.id);

      const resolution = await resolveHuda(
        prisma,
        "",
        `${premierDna.code} ${secondDna.code}`,
        now
      );

      expect(resolution.ok).toBe(false);
      expect(resolution.ok === false && resolution.failure.reason).toContain(
        "2 structures différentes"
      );
    });
  });

  describe("findExistingHudaCadaTransformation", () => {
    const createTransformation = async (
      structureId: number,
      numeroDossier?: string
    ) => {
      const transformation = await prisma.transformation.create({
        data: {
          type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
          numeroDossier,
          structureVersionTransformations: {
            create: {
              type: StructureVersionTransformationType.FERMETURE,
              structureVersion: { create: { structureId } },
            },
          },
        },
      });
      createdTransformationIds.push(transformation.id);
      return transformation;
    };

    it("remonte une transformation initiée par un agent", async () => {
      const huda = await createStructure(StructureType.HUDA);
      const transformation = await createTransformation(huda.id);

      const existing = await findExistingHudaCadaTransformation(
        prisma,
        huda.id
      );

      expect(existing?.id).toBe(transformation.id);
    });

    it("remonte aussi une transformation issue d'un autre dossier Démarches Numériques", async () => {
      const huda = await createStructure(StructureType.HUDA);
      const transformation = await createTransformation(
        huda.id,
        `HC-TEST-${randomUUID()}`
      );

      const existing = await findExistingHudaCadaTransformation(
        prisma,
        huda.id
      );

      expect(existing?.id).toBe(transformation.id);
    });

    it("ne remonte rien quand aucune transformation ne porte sur la structure", async () => {
      const huda = await createStructure(StructureType.HUDA);

      expect(
        await findExistingHudaCadaTransformation(prisma, huda.id)
      ).toBeNull();
    });
  });
});
