import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { findAll } from "@/app/api/dna-codes/dna-codes.repository";
import { createOne } from "@/app/api/transformations/transformation.repository";
import prisma from "@/lib/prisma";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("dna-codes.repository findAll db integration", () => {
  const createdStructureIds: number[] = [];
  const createdTransformationIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: { codeBhasile: `BHA-DC-TEST-${Date.now()}-${randomUUID()}` },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createDnaOnVersion = async (
    structureVersionId: number,
    suffix: string
  ) => {
    const dna = await prisma.dna.create({
      data: { code: `DNA-DC-TEST-${suffix}-${randomUUID()}` },
    });
    await prisma.dnaStructure.create({
      data: { structureVersionId, dnaId: dna.id },
    });
    return dna.code;
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
    if (createdStructureIds.length > 0) {
      await prisma.structure.deleteMany({
        where: { id: { in: createdStructureIds } },
      });
    }
    await prisma.dna.deleteMany({
      where: { code: { startsWith: "DNA-DC-TEST-" } },
    });
  });

  it("inclut les codes libres et ceux des structures de la transformation, et exclut les codes détenus hors de la transformation", async () => {
    const structureInTransfo = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { structureId: structureInTransfo.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
      include: { structureVersion: true },
    });
    const versionInTransfoId = block.structureVersion?.id;
    if (!versionInTransfoId) {
      throw new Error("La version du bloc devrait exister");
    }

    const codeInTransfo = await createDnaOnVersion(versionInTransfoId, "IN");

    const freeDna = await prisma.dna.create({
      data: { code: `DNA-DC-TEST-FREE-${randomUUID()}` },
    });

    const outsideStructure = await createStructure();
    const outsideVersion = await prisma.structureVersion.create({
      data: { structureId: outsideStructure.id },
    });
    const codeOutside = await createDnaOnVersion(outsideVersion.id, "OUT");

    const withTransfo = (await findAll({ transformationId })).map(
      (dna) => dna.code
    );
    expect(withTransfo).toContain(codeInTransfo);
    expect(withTransfo).toContain(freeDna.code);
    expect(withTransfo).not.toContain(codeOutside);

    // Sans transformationId, le code de la structure de la transfo n'est plus
    // "libre" donc disparaît — c'est l'élargissement qui le fait surgir.
    const withoutTransfo = (await findAll()).map((dna) => dna.code);
    expect(withoutTransfo).not.toContain(codeInTransfo);
    expect(withoutTransfo).toContain(freeDna.code);
    expect(withoutTransfo).not.toContain(codeOutside);
  });
});
