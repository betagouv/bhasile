import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { findAll } from "@/app/api/dna-codes/dna-codes.repository";
import { createOne } from "@/app/api/transformations/transformation.repository";
import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { createReferentialDna } from "../../test-utils/referential-dna";

describe("dna-codes.repository findAll db integration", () => {
  const createdStructureIds: number[] = [];
  const createdTransformationIds: number[] = [];
  const createdOperateurIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DC-TEST-${Date.now()}-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createOperateur = async () => {
    const operateur = await prisma.operateur.create({
      data: { name: `DNA-DC-TEST-OP-${randomUUID()}` },
    });
    createdOperateurIds.push(operateur.id);
    return operateur;
  };

  const createDnaOnVersion = async (
    structureVersionId: number,
    suffix: string
  ) => {
    const dna = await createReferentialDna(
      `DNA-DC-TEST-${suffix}-${randomUUID()}`
    );
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
    await prisma.operateur.deleteMany({
      where: { id: { in: createdOperateurIds } },
    });
  });

  it("inclut les codes libres et ceux des versions de la structure quand structureId est fourni", async () => {
    const structure = await createStructure();
    const version = await prisma.structureVersion.create({
      data: { structureId: structure.id },
    });
    const ownCode = await createDnaOnVersion(version.id, "OWN");

    const freeDna = await createReferentialDna(
      `DNA-DC-TEST-FREE-${randomUUID()}`
    );

    const outsideStructure = await createStructure();
    const outsideVersion = await prisma.structureVersion.create({
      data: { structureId: outsideStructure.id },
    });
    const codeOutside = await createDnaOnVersion(outsideVersion.id, "OUT");

    const codes = (
      await findAll({ entityId: { structureId: structure.id } })
    ).map((dna) => dna.code);

    expect(codes).toContain(ownCode);
    expect(codes).toContain(freeDna.code);
    expect(codes).not.toContain(codeOutside);
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

    const freeDna = await createReferentialDna(
      `DNA-DC-TEST-FREE-${randomUUID()}`
    );

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

  it("restreint les codes libres aux opérateurs demandés", async () => {
    const operateur = await createOperateur();
    const otherOperateur = await createOperateur();

    const [ownCode, otherCode] = await Promise.all(
      [operateur, otherOperateur].map(
        async (dnaOperateur) =>
          (
            await createReferentialDna(`DNA-DC-TEST-OP-${randomUUID()}`, {
              operateur: { connect: { id: dnaOperateur.id } },
            })
          ).code
      )
    );

    const codes = (await findAll({ operateurIds: [operateur.id] })).map(
      (dna) => dna.code
    );

    expect(codes).toContain(ownCode);
    expect(codes).not.toContain(otherCode);
  });

  it("restreint les codes libres au département et au type demandés", async () => {
    const [departement, otherDepartement] = await prisma.departement.findMany({
      take: 2,
      orderBy: { numero: "asc" },
    });

    const createFreeDna = async (
      suffix: string,
      departementNumero: string,
      type: StructureType
    ) =>
      (
        await createReferentialDna(`DNA-DC-TEST-${suffix}-${randomUUID()}`, {
          departement: { connect: { numero: departementNumero } },
          type,
        })
      ).code;

    const [matchingCode, otherDepartementCode, otherTypeCode] =
      await Promise.all([
        createFreeDna("MATCH", departement.numero, StructureType.HUDA),
        createFreeDna(
          "OTHER-DEPT",
          otherDepartement.numero,
          StructureType.HUDA
        ),
        createFreeDna("OTHER-TYPE", departement.numero, StructureType.CADA),
      ]);

    const codes = (
      await findAll({
        departementAdministratif: departement.numero,
        type: StructureType.HUDA,
      })
    ).map((dna) => dna.code);

    expect(codes).toContain(matchingCode);
    expect(codes).not.toContain(otherDepartementCode);
    expect(codes).not.toContain(otherTypeCode);
  });

  it("garde les codes détenus par la structure même s'ils ne correspondent pas aux filtres", async () => {
    const operateur = await createOperateur();
    const structure = await createStructure();
    const version = await prisma.structureVersion.create({
      data: { structureId: structure.id },
    });
    const ownCode = await createDnaOnVersion(version.id, "OWN-UNMATCHED");

    const codes = (
      await findAll({
        entityId: { structureId: structure.id },
        operateurIds: [operateur.id],
        departementAdministratif: "00",
        type: StructureType.HUDA,
      })
    ).map((dna) => dna.code);

    expect(codes).toContain(ownCode);
  });

  it("renvoie le département administratif de chaque code", async () => {
    const freeDna = await createReferentialDna(
      `DNA-DC-TEST-DEPT-${randomUUID()}`
    );

    const found = (await findAll()).find((dna) => dna.code === freeDna.code);

    expect(found).toEqual({
      code: freeDna.code,
      departementAdministratif: freeDna.departementAdministratif,
    });
  });
});
