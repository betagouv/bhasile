import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOne,
  findOne,
  updateOne,
} from "@/app/api/transformations/transformation.repository";
import prisma from "@/lib/prisma";
import { Repartition } from "@/types/adresse.type";
import { PublicType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("transformation.repository db integration", () => {
  const createdStructureIds: number[] = [];
  const createdTransformationIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-TF-TEST-${Date.now()}-${Math.random()}`,
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createBareTransformation = async () => {
    const structure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          structureId: structure.id,
          type: StructureTransformationType.CREATION,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const structureTransformation =
      await prisma.structureTransformation.findFirstOrThrow({
        where: { transformationId },
      });
    return {
      transformationId,
      structureTransformationId: structureTransformation.id,
      structureId: structure.id,
    };
  };

  beforeAll(async () => {
    const formDefinition = await prisma.formDefinition.findUnique({
      where: { slug: "transformation-v1" },
    });
    if (!formDefinition) {
      await prisma.formDefinition.create({
        data: {
          name: "transformation",
          slug: "transformation-v1",
          version: 1,
        },
      });
    }
  });

  afterAll(async () => {
    if (createdTransformationIds.length > 0) {
      await prisma.structureTransformation.deleteMany({
        where: {
          transformationId: { in: createdTransformationIds },
        },
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
      where: { code: { startsWith: "DNA-TF-TEST-" } },
    });
  });

  it("should persist transformation, structureTransformations and initial form on createOne", async () => {
    const structure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureTransformations: [
        {
          structureId: structure.id,
          type: StructureTransformationType.EXTENSION,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: {
        structureTransformations: true,
        form: { include: { formDefinition: true } },
      },
    });
    expect(transformation.type).toBe(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    expect(transformation.structureTransformations).toHaveLength(1);
    expect(transformation.structureTransformations[0].structureId).toBe(
      structure.id
    );
    expect(transformation.structureTransformations[0].type).toBe(
      StructureTransformationType.EXTENSION
    );
    expect(transformation.form).not.toBeNull();
    expect(transformation.form?.formDefinition.slug).toBe("transformation-v1");
  });

  it("should return nested includes from findOne after createOne", async () => {
    const { transformationId } = await createBareTransformation();
    const row = await findOne(transformationId);
    expect(row.id).toBe(transformationId);
    expect(row.structureTransformations.length).toBeGreaterThanOrEqual(1);
    expect(row.structureTransformations[0].structure).toBeDefined();
    expect(row.form?.formDefinition).toBeDefined();
  });

  it("should update all transformation and structureTransformation scalar fields in one updateOne call", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    const departement = await prisma.departement.findFirstOrThrow();

    const newStructureTransformation = {
      id: structureTransformationId,
      type: StructureTransformationType.FERMETURE,
      date: "2023-08-08T12:00:00.000Z",
      motif: "Motif fermeture test",
      public: PublicType.FAMILLE,
      adresseAdministrative: "5 avenue de la Transformation",
      codePostalAdministratif: "69000",
      communeAdministrative: "Lyon",
      departementAdministratif: departement.numero,
      nom: "Nom post-transfo",
      placesAutorisees: 120,
      pmr: 5,
      lgbt: 2,
      fvvTeh: 1,
    };
    await updateOne({
      id: transformationId,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureTransformations: [newStructureTransformation],
    });

    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
    });
    expect(transformation.type).toBe(TransformationType.EXTENSION_EX_NIHILO);

    const st = await prisma.structureTransformation.findUniqueOrThrow({
      where: { id: structureTransformationId },
    });
    expect({ ...st, date: st.date?.toISOString() }).toMatchObject({
      ...newStructureTransformation,
      public: "FAMILLE",
    });
  });

  it("should replace structureTransformation contacts on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    await prisma.contact.create({
      data: {
        structureTransformationId,
        prenom: "Legacy",
        nom: "Contact",
        email: "legacy@example.test",
        telephone: "0100000000",
        role: "Ancien",
        perimetre: "Local",
      },
    });
    const newContact = {
      prenom: "Nouveau",
      nom: "Contact",
      email: "nouveau@example.test",
      telephone: "0200000000",
      role: "Direction",
      perimetre: "National",
    };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: structureTransformationId, contacts: [newContact] },
      ],
    });
    const contacts = await prisma.contact.findMany({
      where: { structureTransformationId },
      orderBy: { id: "asc" },
    });
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(newContact);
  });

  it("should replace structureTransformation adresses and typologies on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    const oldAdresse = await prisma.adresse.create({
      data: {
        structureTransformationId,
        adresse: "Ancienne",
        codePostal: "13000",
        commune: "Marseille",
      },
    });
    const newAdresse = {
      adresse: "Nouvelle adresse transfo",
      codePostal: "31000",
      commune: "Toulouse",
      repartition: Repartition.DIFFUS,
      adresseTypologies: [
        { year: 2026, placesAutorisees: 20, qpv: 1, logementSocial: 2 },
      ],
    };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: structureTransformationId, adresses: [newAdresse] },
      ],
    });
    const adresses = await prisma.adresse.findMany({
      where: { structureTransformationId },
      include: { adresseTypologies: true },
    });
    expect(adresses).toHaveLength(1);
    expect(adresses[0].id).not.toBe(oldAdresse.id);
    expect(adresses[0]).toMatchObject({
      ...newAdresse,
      repartition: "DIFFUS",
    });
  });

  it("should replace structureTransformation antennes on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    await prisma.antenne.create({
      data: {
        structureTransformationId,
        name: "old-antenne-tf",
      },
    });
    const newAntenne = {
      name: "new-antenne-tf",
      commune: "Grenoble",
      departement: "38",
    };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: structureTransformationId, antennes: [newAntenne] },
      ],
    });
    const antennes = await prisma.antenne.findMany({
      where: { structureTransformationId },
    });
    expect(antennes).toHaveLength(1);
    expect(antennes[0]).toMatchObject(newAntenne);
  });

  it("should replace structureTransformation finesses on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    await prisma.finess.create({
      data: {
        structureTransformationId,
        code: `FIN-OLD-TF-${Date.now()}-${randomUUID()}`,
      },
    });
    const newCode = `FIN-NEW-TF-${Date.now()}-${randomUUID()}`;
    const newFiness = { code: newCode, description: "finess transfo" };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: structureTransformationId, finesses: [newFiness] },
      ],
    });
    const finesses = await prisma.finess.findMany({
      where: { structureTransformationId },
    });
    expect(finesses).toHaveLength(1);
    expect(finesses[0]).toMatchObject(newFiness);
  });

  it("should upsert structureTransformation structureTypologies by year on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    await prisma.structureTypologie.create({
      data: {
        structureTransformationId,
        year: 2024,
        placesAutorisees: 10,
        pmr: 1,
        lgbt: 0,
        fvvTeh: 0,
      },
    });
    const newTypologie = {
      year: 2024,
      placesAutorisees: 33,
      pmr: 4,
      lgbt: 1,
      fvvTeh: 0,
    };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: structureTransformationId, structureTypologies: [newTypologie] },
      ],
    });
    const rows = await prisma.structureTypologie.findMany({
      where: { structureTransformationId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newTypologie);
  });

  it("should upsert structureTransformation structureMillesimes by year on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    await prisma.structureMillesime.create({
      data: {
        structureTransformationId,
        year: 2024,
        cpom: false,
      },
    });
    const newMillesime = {
      year: 2024,
      cpom: true,
      operateurComment: "Commentaire millesime transfo",
    };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          structureMillesimes: [newMillesime],
        },
      ],
    });
    const rows = await prisma.structureMillesime.findMany({
      where: { structureTransformationId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newMillesime);
  });

  it("should replace dnaStructureTransformations and upsert Dna on updateOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    const oldDna = await prisma.dna.create({
      data: { code: `DNA-TF-TEST-OLD-${randomUUID()}` },
    });
    await prisma.dnaStructureTransformation.create({
      data: {
        structureTransformationId,
        dnaId: oldDna.id,
      },
    });
    const newCode = `DNA-TF-TEST-${randomUUID()}`;
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          dnas: [{ dna: { code: newCode, description: "Desc transfo" } }],
        },
      ],
    });
    const links = await prisma.dnaStructureTransformation.findMany({
      where: { structureTransformationId },
      include: { dna: true },
    });
    expect(links).toHaveLength(1);
    expect(links[0].dna.code).toBe(newCode);
    expect(links[0].dna.description).toBe("Desc transfo");
  });

  it("should upsert transformation form status on updateOne", async () => {
    const { transformationId } = await createBareTransformation();
    const formRow = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    const formDefinition = await prisma.formDefinition.findUniqueOrThrow({
      where: { id: formRow.formDefinitionId },
    });
    expect(formDefinition.slug).toBe("transformation-v1");

    const newForm = {
      id: formRow.id,
      status: true,
      formDefinition: {
        id: formDefinition.id,
        slug: formDefinition.slug,
        name: formDefinition.name,
        version: formDefinition.version,
      },
      formSteps: [],
    };
    await updateOne({
      id: transformationId,
      form: newForm,
    });
    const form = await prisma.form.findUniqueOrThrow({
      where: {
        transformationId_formDefinitionId: {
          transformationId,
          formDefinitionId: formDefinition.id,
        },
      },
    });
    expect(form.status).toBe(true);
    expect(form.formDefinitionId).toBe(formDefinition.id);
  });

  it("should create a new structureTransformation when updateOne omits id but provides structureId and type", async () => {
    const structureA = await createStructure();
    const structureB = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          structureId: structureA.id,
          type: StructureTransformationType.CREATION,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          structureId: structureB.id,
          type: StructureTransformationType.EXTENSION,
        },
      ],
    });

    const rows = await prisma.structureTransformation.findMany({
      where: { transformationId },
      orderBy: { id: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.structureId).sort()).toEqual(
      [structureA.id, structureB.id].sort()
    );
    const created = rows.find((r) => r.structureId === structureB.id);
    expect(created?.type).toBe(StructureTransformationType.EXTENSION);
  });
});
