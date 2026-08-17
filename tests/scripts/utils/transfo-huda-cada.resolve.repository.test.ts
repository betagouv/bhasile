import { afterAll, describe, expect, it } from "vitest";

import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  findHudaCadaTransformations,
  matchesEnvelope,
  resolveHudas,
  resolveTargetCada,
} from "../../../scripts/utils/transfo-huda-cada.resolve";
import { createReferentialDna } from "../../test-utils/referential-dna";

const CODE_BHASILE_PREFIX = "BHA-ZZZ-";

describe("transfo-huda-cada.resolve db integration", () => {
  const effectiveDate = new Date("2026-07-01T00:00:00.000Z");
  const createdTransformationIds: number[] = [];
  const createdDnaIds: number[] = [];
  const createdOperateurIds: number[] = [];

  const pickFreeCodeBhasile = async () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const code = `${CODE_BHASILE_PREFIX}${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`;
      if (await prisma.structure.findUnique({ where: { codeBhasile: code } })) {
        continue;
      }
      return code;
    }
    throw new Error("Impossible de générer un code Bhasile libre");
  };

  const createStructure = async (
    type: StructureType | null,
    { fermetureDate }: { fermetureDate?: Date } = {}
  ) =>
    prisma.structure.create({
      data: {
        codeBhasile: await pickFreeCodeBhasile(),
        type,
        fermetureDate,
        departementAdministratif: "50",
      },
    });

  const createVersion = async (structureId: number, effectiveDate: Date) =>
    prisma.structureVersion.create({ data: { structureId, effectiveDate } });

  /* Le parseur n'accepte que [A-Z]\d{4}, et la base peut déjà contenir le code tiré */
  const createDna = async (departement: string) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const serie = String(Math.floor(Math.random() * 100)).padStart(2, "0");
      const code = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${departement}${serie}`;
      if (await prisma.dna.findUnique({ where: { code } })) {
        continue;
      }
      const dna = await createReferentialDna(code);
      createdDnaIds.push(dna.id);
      createdOperateurIds.push(dna.operateurId);
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

  const createHudaWithDna = async (
    departement: string,
    effectiveDate: Date
  ) => {
    const structure = await createStructure(StructureType.HUDA);
    const version = await createVersion(structure.id, effectiveDate);
    const dna = await createDna(departement);
    await linkDnaToVersion(version.id, dna.id);
    return { structure, dna };
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
    await prisma.operateur.deleteMany({
      where: { id: { in: createdOperateurIds } },
    });
  });

  const reasonOf = (resolution: { ok: boolean } & Record<string, unknown>) =>
    resolution.ok === false
      ? (resolution.failure as { reason: string }).reason
      : "";

  describe("resolveHudas", () => {
    it("rattache un HUDA par son code Bhasile", async () => {
      const structure = await createStructure(StructureType.HUDA);

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [structure.codeBhasile],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok && resolution.value).toEqual([
        {
          structureId: structure.id,
          codeBhasile: structure.codeBhasile,
          operateurId: null,
          via: "code-bhasile",
        },
      ]);
    });

    it("rattache les deux HUDA quand un même champ contient deux codes Bhasile", async () => {
      const premier = await createStructure(StructureType.HUDA);
      const second = await createStructure(StructureType.HUDA);

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [`${premier.codeBhasile} et ${second.codeBhasile}`],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok).toBe(true);
      expect(
        resolution.ok && resolution.value.map(({ structureId }) => structureId)
      ).toEqual([premier.id, second.id]);
    });

    it("rejette une structure qui n'est pas un HUDA", async () => {
      const structure = await createStructure(StructureType.CADA);

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [structure.codeBhasile],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain("n'est pas un HUDA");
    });

    it("rejette une structure dont le type n'est pas renseigné", async () => {
      const structure = await createStructure(null);

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [structure.codeBhasile],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain("type non renseigné");
    });

    it("rejette un HUDA fermé", async () => {
      const structure = await createStructure(StructureType.HUDA, {
        fermetureDate: new Date("2026-03-01T00:00:00.000Z"),
      });

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [structure.codeBhasile],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain(
        "est fermé à la date d'effet (fermeture le 01/03/2026)"
      );
    });

    it("rattache un HUDA dont la fermeture est postérieure à la date d'effet", async () => {
      const structure = await createStructure(StructureType.HUDA, {
        fermetureDate: new Date("2026-09-01T00:00:00.000Z"),
      });

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [structure.codeBhasile],
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok).toBe(true);
    });

    it("ignore une non-valeur saisie dans le champ code Bhasile", async () => {
      const { structure, dna } = await createHudaWithDna(
        "35",
        new Date("2026-01-01T00:00:00.000Z")
      );

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: ["Multi DNA"],
          rawDnaCodes: [dna.code],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok && resolution.value).toEqual([
        {
          structureId: structure.id,
          codeBhasile: structure.codeBhasile,
          operateurId: null,
          via: "codes-dna",
        },
      ]);
    });

    it("additionne les structures désignées par code Bhasile et par codes DNA", async () => {
      const parCode = await createStructure(StructureType.HUDA);
      const { structure: byDnaCodes, dna } = await createHudaWithDna(
        "35",
        new Date("2026-01-01T00:00:00.000Z")
      );

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [parCode.codeBhasile],
          rawDnaCodes: [dna.code],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok).toBe(true);
      expect(
        resolution.ok && resolution.value.map(({ structureId }) => structureId)
      ).toEqual([parCode.id, byDnaCodes.id]);
    });

    it("ferme les deux HUDA quand les codes DNA pointent vers deux structures", async () => {
      const premier = await createHudaWithDna(
        "83",
        new Date("2026-01-01T00:00:00.000Z")
      );
      const second = await createHudaWithDna(
        "83",
        new Date("2026-01-01T00:00:00.000Z")
      );

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [],
          rawDnaCodes: [`${premier.dna.code} et ${second.dna.code}`],
          departement: "83",
        },
        effectiveDate
      );

      expect(resolution.ok).toBe(true);
      expect(
        resolution.ok && resolution.value.map(({ codeBhasile }) => codeBhasile)
      ).toHaveLength(2);
    });

    it("ignore un rattachement porté par une version que la version courante ne reprend pas", async () => {
      const { structure: ancien, dna } = await createHudaWithDna(
        "35",
        new Date("2024-01-01T00:00:00.000Z")
      );
      await createVersion(ancien.id, new Date("2026-01-01T00:00:00.000Z"));

      const resolution = await resolveHudas(
        prisma,
        { rawBhasileCodes: [], rawDnaCodes: [dna.code], departement: "35" },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain(`inconnus en base : ${dna.code}`);
    });

    it("rejette le dossier entier quand un code est illisible", async () => {
      const { dna } = await createHudaWithDna(
        "35",
        new Date("2026-01-01T00:00:00.000Z")
      );

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [],
          rawDnaCodes: [`${dna.code} H351`],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain("illisibles : H351");
    });

    it("rattrape un zéro manquant quand le code padé existe et colle au département", async () => {
      const { structure, dna } = await createHudaWithDna(
        "09",
        new Date("2026-01-01T00:00:00.000Z")
      );
      const codeSansZero = `${dna.code[0]}${dna.code.slice(2)}`;

      const resolution = await resolveHudas(
        prisma,
        {
          rawBhasileCodes: [],
          rawDnaCodes: [codeSansZero],
          departement: "09",
        },
        effectiveDate
      );

      expect(
        resolution.ok && resolution.value.map(({ structureId }) => structureId)
      ).toEqual([structure.id]);
    });

    it("rejette un code hors du département du dossier", async () => {
      const { dna } = await createHudaWithDna(
        "20",
        new Date("2026-01-01T00:00:00.000Z")
      );

      const resolution = await resolveHudas(
        prisma,
        { rawBhasileCodes: [], rawDnaCodes: [dna.code], departement: "02" },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain(
        `hors département 02 : ${dna.code}`
      );
    });
  });

  describe("resolveTargetCada", () => {
    it("résout le CADA cible par son code Bhasile", async () => {
      const cada = await createStructure(StructureType.CADA);

      const resolution = await resolveTargetCada(
        prisma,
        {
          rawBhasileCode: cada.codeBhasile,
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(resolution.ok && resolution.value.structureId).toBe(cada.id);
    });

    it("retombe sur les codes DNA quand le code Bhasile est absent", async () => {
      const cada = await createStructure(StructureType.CADA);
      const version = await createVersion(
        cada.id,
        new Date("2026-01-01T00:00:00.000Z")
      );
      const dna = await createDna("35");
      await linkDnaToVersion(version.id, dna.id);

      const resolution = await resolveTargetCada(
        prisma,
        { rawBhasileCode: "", rawDnaCodes: [dna.code], departement: "35" },
        effectiveDate
      );

      expect(resolution.ok && resolution.value.structureId).toBe(cada.id);
    });

    it("rejette un CADA cible qui résout vers plusieurs structures", async () => {
      const premier = await createStructure(StructureType.CADA);
      const second = await createStructure(StructureType.CADA);
      const dates = new Date("2026-01-01T00:00:00.000Z");
      const premierDna = await createDna("35");
      const secondDna = await createDna("35");
      await linkDnaToVersion(
        (await createVersion(premier.id, dates)).id,
        premierDna.id
      );
      await linkDnaToVersion(
        (await createVersion(second.id, dates)).id,
        secondDna.id
      );

      const resolution = await resolveTargetCada(
        prisma,
        {
          rawBhasileCode: "",
          rawDnaCodes: [`${premierDna.code} ${secondDna.code}`],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain("pointent vers 2 structures");
    });

    it("rejette un dossier qui prévoit plusieurs CADA d'accueil", async () => {
      const premier = await createStructure(StructureType.CADA);
      const second = await createStructure(StructureType.CADA);

      const resolution = await resolveTargetCada(
        prisma,
        {
          rawBhasileCode: `${premier.codeBhasile} et ${second.codeBhasile}`,
          rawDnaCodes: [],
          departement: "35",
        },
        effectiveDate
      );

      expect(reasonOf(resolution)).toContain("2 CADA d'accueil");
    });
  });

  describe("findHudaCadaTransformations", () => {
    const createTransformation = async (
      structureIds: number[],
      numeroDossier?: string
    ) => {
      const transformation = await prisma.transformation.create({
        data: {
          type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
          numeroDossier,
          structureVersionTransformations: {
            create: structureIds.map((structureId) => ({
              type: StructureVersionTransformationType.FERMETURE,
              structureVersion: { create: { structureId } },
            })),
          },
        },
      });
      createdTransformationIds.push(transformation.id);
      return transformation;
    };

    it("remonte une transformation initiée par un agent, avec son enveloppe", async () => {
      const huda = await createStructure(StructureType.HUDA);
      const transformation = await createTransformation([huda.id]);

      const [existing] = await findHudaCadaTransformations(prisma, [huda.id]);

      expect(existing.id).toBe(transformation.id);
      expect(existing.numeroDossier).toBeNull();
      expect(existing.fermetureStructureIds).toEqual([huda.id]);
    });

    it("ne remonte rien quand aucune transformation ne porte sur les structures", async () => {
      const huda = await createStructure(StructureType.HUDA);

      expect(await findHudaCadaTransformations(prisma, [huda.id])).toEqual([]);
    });

    it("remonte la transformation dès qu'un seul HUDA de l'enveloppe est déjà pris", async () => {
      const premier = await createStructure(StructureType.HUDA);
      const second = await createStructure(StructureType.HUDA);
      await createTransformation([premier.id]);

      const existing = await findHudaCadaTransformations(prisma, [
        premier.id,
        second.id,
      ]);

      expect(existing).toHaveLength(1);
      expect(matchesEnvelope(existing[0], [premier.id, second.id])).toBe(false);
    });

    it("reconnaît une enveloppe identique quel que soit l'ordre", async () => {
      const premier = await createStructure(StructureType.HUDA);
      const second = await createStructure(StructureType.HUDA);
      await createTransformation([premier.id, second.id]);

      const [existing] = await findHudaCadaTransformations(prisma, [
        premier.id,
        second.id,
      ]);

      expect(matchesEnvelope(existing, [second.id, premier.id])).toBe(true);
    });
  });
});
