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
  const createdOperateurIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-TF-TEST-${Date.now()}-${Math.random()}`,
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createOperateur = async () => {
    const operateur = await prisma.operateur.create({
      data: { name: `OP-TF-TEST-${Date.now()}-${randomUUID()}` },
    });
    createdOperateurIds.push(operateur.id);
    return operateur;
  };

  const createFileUpload = async (prefix: string) => {
    return prisma.fileUpload.create({
      data: {
        key: `FILE-TF-TEST-${prefix}-${Date.now()}-${randomUUID()}`,
        mimeType: "application/pdf",
        fileSize: 42,
        originalName: `${prefix}.pdf`,
      },
    });
  };

  const createBareTransformation = async () => {
    const structure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const structureTransformation =
      await prisma.structureTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    if (!structureTransformation.structureVersion) {
      throw new Error("StructureVersion should be created with transfo");
    }
    return {
      transformationId,
      structureTransformationId: structureTransformation.id,
      structureVersionId: structureTransformation.structureVersion.id,
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
    if (createdOperateurIds.length > 0) {
      await prisma.operateur.deleteMany({
        where: { id: { in: createdOperateurIds } },
      });
    }
    await prisma.dna.deleteMany({
      where: { code: { startsWith: "DNA-TF-TEST-" } },
    });
    await prisma.fileUpload.deleteMany({
      where: { key: { startsWith: "FILE-TF-TEST-" } },
    });
  });

  it("should persist transformation, structureTransformations and initial form on createOne", async () => {
    const structure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureTransformations: [
        {
          type: StructureTransformationType.EXTENSION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: {
        structureTransformations: { include: { structureVersion: true } },
        form: { include: { formDefinition: true } },
      },
    });
    expect(transformation.type).toBe(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    expect(transformation.structureTransformations).toHaveLength(1);
    expect(transformation.structureTransformations[0].type).toBe(
      StructureTransformationType.EXTENSION
    );
    expect(
      transformation.structureTransformations[0].structureVersion?.structureId
    ).toBe(structure.id);
    expect(transformation.form).not.toBeNull();
    expect(transformation.form?.formDefinition.slug).toBe("transformation-v1");
  });

  it("should return nested includes from findOne after createOne", async () => {
    const { transformationId } = await createBareTransformation();
    const row = await findOne(transformationId);
    expect(row.id).toBe(transformationId);
    expect(row.structureTransformations.length).toBeGreaterThanOrEqual(1);
    expect(row.structureTransformations[0].structureVersion).toBeDefined();
    expect(
      row.structureTransformations[0].structureVersion?.structure
    ).toBeDefined();
    expect(row.form?.formDefinition).toBeDefined();
  });

  it("should update transformation, structureTransformation and structureVersion scalar fields in one updateOne call", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    const departement = await prisma.departement.findFirstOrThrow();

    await updateOne({
      id: transformationId,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureTransformations: [
        {
          id: structureTransformationId,
          type: StructureTransformationType.FERMETURE,
          date: "2023-08-08T12:00:00.000Z",
          motif: "Motif fermeture test",
          structureVersion: {
            id: structureVersionId,
            public: PublicType.FAMILLE,
            adresseAdministrative: "5 avenue de la Transformation",
            codePostalAdministratif: "69000",
            communeAdministrative: "Lyon",
            departementAdministratif: departement.numero,
            nom: "Nom post-transfo",
            lgbt: true,
            fvvTeh: false,
          },
        },
      ],
    });

    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
    });
    expect(transformation.type).toBe(TransformationType.EXTENSION_EX_NIHILO);

    const st = await prisma.structureTransformation.findUniqueOrThrow({
      where: { id: structureTransformationId },
      include: { structureVersion: true },
    });
    expect(st.type).toBe(StructureTransformationType.FERMETURE);
    expect(st.date?.toISOString()).toBe("2023-08-08T12:00:00.000Z");
    expect(st.motif).toBe("Motif fermeture test");
    expect(st.structureVersion).toMatchObject({
      public: "FAMILLE",
      adresseAdministrative: "5 avenue de la Transformation",
      codePostalAdministratif: "69000",
      communeAdministrative: "Lyon",
      departementAdministratif: departement.numero,
      nom: "Nom post-transfo",
      lgbt: true,
      fvvTeh: false,
    });
  });

  it("should replace structureVersion contacts on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    await prisma.contact.create({
      data: {
        structureVersionId,
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
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            contacts: [newContact],
          },
        },
      ],
    });
    const contacts = await prisma.contact.findMany({
      where: { structureVersionId },
      orderBy: { id: "asc" },
    });
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(newContact);
  });

  it("should replace structureVersion adresses and typologies on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    const oldAdresse = await prisma.adresse.create({
      data: {
        structureVersionId,
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
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            adresses: [newAdresse],
          },
        },
      ],
    });
    const adresses = await prisma.adresse.findMany({
      where: { structureVersionId },
      include: { adresseTypologies: true },
    });
    expect(adresses).toHaveLength(1);
    expect(adresses[0].id).not.toBe(oldAdresse.id);
    expect(adresses[0]).toMatchObject({
      ...newAdresse,
      repartition: "DIFFUS",
    });
  });

  it("should replace structureVersion antennes on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    await prisma.antenne.create({
      data: {
        structureVersionId,
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
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            antennes: [newAntenne],
          },
        },
      ],
    });
    const antennes = await prisma.antenne.findMany({
      where: { structureVersionId },
    });
    expect(antennes).toHaveLength(1);
    expect(antennes[0]).toMatchObject(newAntenne);
  });

  it("should replace structureVersion finesses on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    await prisma.finess.create({
      data: {
        structureVersionId,
        code: `FIN-OLD-TF-${Date.now()}-${randomUUID()}`,
      },
    });
    const newCode = `FIN-NEW-TF-${Date.now()}-${randomUUID()}`;
    const newFiness = { code: newCode, description: "finess transfo" };
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            finesses: [newFiness],
          },
        },
      ],
    });
    const finesses = await prisma.finess.findMany({
      where: { structureVersionId },
    });
    expect(finesses).toHaveLength(1);
    expect(finesses[0]).toMatchObject(newFiness);
  });

  it("should upsert structureVersion structureTypologies by year on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    await prisma.structureTypologie.create({
      data: {
        structureVersionId,
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
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            structureTypologies: [newTypologie],
          },
        },
      ],
    });
    const rows = await prisma.structureTypologie.findMany({
      where: { structureVersionId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newTypologie);
  });

  it("should replace structureVersion dnaStructures and upsert Dna on updateOne", async () => {
    const { transformationId, structureTransformationId, structureVersionId } =
      await createBareTransformation();
    const oldDna = await prisma.dna.create({
      data: { code: `DNA-TF-TEST-OLD-${randomUUID()}` },
    });
    await prisma.dnaStructure.create({
      data: {
        structureVersionId,
        dnaId: oldDna.id,
      },
    });
    const newCode = `DNA-TF-TEST-${randomUUID()}`;
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          structureVersion: {
            id: structureVersionId,
            dnaStructures: [
              { dna: { code: newCode, description: "Desc transfo" } },
            ],
          },
        },
      ],
    });
    const links = await prisma.dnaStructure.findMany({
      where: { structureVersionId },
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

  it("should persist operateurId on structureTransformation when creating", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const st = await prisma.structureTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    expect(st.operateurId).toBe(operateur.id);
  });

  it("should default operateurId to null when not provided on createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        { type: StructureTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const st = await prisma.structureTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    expect(st.operateurId).toBeNull();
  });

  it("should NOT initialize a StructureVersion when structureVersion is not provided to createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        { type: StructureTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const structureTransformation =
      await prisma.structureTransformation.findFirstOrThrow({
        where: { transformationId },
      });
    const structureVersion = await prisma.structureVersion.findFirst({
      where: { structureTransformationId: structureTransformation.id },
    });
    expect(structureVersion).toBeNull();
  });

  it("should initialize default forms for each structureTransformation on createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        { type: StructureTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const structureTransformation =
      await prisma.structureTransformation.findFirstOrThrow({
        where: { transformationId },
      });
    const formCount = await prisma.form.count({
      where: { structureTransformationId: structureTransformation.id },
    });
    expect(formCount).toBeGreaterThan(0);
  });

  it("should update operateurId on updateOne", async () => {
    const operateurA = await createOperateur();
    const operateurB = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          operateurId: operateurA.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: st.id, operateurId: operateurB.id },
      ],
    });

    const updated = await prisma.structureTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBe(operateurB.id);
  });

  it("should clear operateurId when explicitly set to null on updateOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    await updateOne({
      id: transformationId,
      structureTransformations: [{ id: st.id, operateurId: null }],
    });

    const updated = await prisma.structureTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBeNull();
  });

  it("should leave operateurId unchanged when omitted on updateOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    // Update some other field without touching operateurId
    await updateOne({
      id: transformationId,
      structureTransformations: [
        { id: st.id, motif: "Untouched operateur" },
      ],
    });

    const updated = await prisma.structureTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBe(operateur.id);
    expect(updated.motif).toBe("Untouched operateur");
  });

  it("should return operateur narrowed to { id, name } from findOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const row = await findOne(transformationId);
    const fetchedOperateur = row.structureTransformations[0].operateur;
    expect(fetchedOperateur).toEqual({
      id: operateur.id,
      name: operateur.name,
    });
    // Ensure narrow shape: no siret, siegeSocial, createdAt, etc.
    expect(Object.keys(fetchedOperateur ?? {}).sort()).toEqual(["id", "name"]);
  });

  it("should create a new structureTransformation when updateOne omits id but provides structureVersion.structureId and type", async () => {
    const structureA = await createStructure();
    const structureB = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          structureVersion: { structureId: structureA.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          type: StructureTransformationType.EXTENSION,
          structureVersion: { structureId: structureB.id },
        },
      ],
    });

    const rows = await prisma.structureTransformation.findMany({
      where: { transformationId },
      include: { structureVersion: true },
      orderBy: { id: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(
      rows.map((r) => r.structureVersion?.structureId).sort()
    ).toEqual([structureA.id, structureB.id].sort());
    const created = rows.find(
      (r) => r.structureVersion?.structureId === structureB.id
    );
    expect(created?.type).toBe(StructureTransformationType.EXTENSION);
  });

  it("should persist and read back actesAdministratifs on a structureTransformation via updateOne/findOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    const file = await createFileUpload("acte");

    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          actesAdministratifs: [
            {
              category: "ARRETE_AUTORISATION",
              startDate: "2024-01-01T00:00:00.000Z",
              endDate: "2025-01-01T00:00:00.000Z",
              fileUploads: [{ key: file.key }],
            },
          ],
        },
      ],
    });

    // persisted on the structureTransformation
    const persisted = await prisma.acteAdministratif.findMany({
      where: { structureTransformationId },
      include: { fileUploads: true },
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0].category).toBe("ARRETE_AUTORISATION");
    expect(persisted[0].fileUploads).toMatchObject([{ key: file.key }]);

    // read back through the findOne include
    const row = await findOne(transformationId);
    const structureTransformation = row.structureTransformations.find(
      (candidate) => candidate.id === structureTransformationId
    );
    expect(structureTransformation?.actesAdministratifs).toHaveLength(1);
    expect(structureTransformation?.actesAdministratifs[0].category).toBe(
      "ARRETE_AUTORISATION"
    );
    expect(
      structureTransformation?.actesAdministratifs[0].fileUploads
    ).toMatchObject([{ key: file.key }]);
  });

  it("should delete structureTransformation actesAdministratifs that are no longer present (scoped cleanup)", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();
    const keptFile = await createFileUpload("keep");
    const droppedFile = await createFileUpload("drop");

    // first save: two actes
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          actesAdministratifs: [
            {
              category: "ARRETE_AUTORISATION",
              fileUploads: [{ key: keptFile.key }],
            },
            {
              category: "ARRETE_TARIFICATION",
              fileUploads: [{ key: droppedFile.key }],
            },
          ],
        },
      ],
    });
    expect(
      await prisma.acteAdministratif.count({
        where: { structureTransformationId },
      })
    ).toBe(2);

    // second save: only the first acte remains
    await updateOne({
      id: transformationId,
      structureTransformations: [
        {
          id: structureTransformationId,
          actesAdministratifs: [
            {
              category: "ARRETE_AUTORISATION",
              fileUploads: [{ key: keptFile.key }],
            },
          ],
        },
      ],
    });

    const remaining = await prisma.acteAdministratif.findMany({
      where: { structureTransformationId },
      include: { fileUploads: true },
    });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].category).toBe("ARRETE_AUTORISATION");
    expect(remaining[0].fileUploads).toMatchObject([{ key: keptFile.key }]);
  });

  it("should return structureTransformation forms with their steps from findOne", async () => {
    const { transformationId, structureTransformationId } =
      await createBareTransformation();

    const row = await findOne(transformationId);
    const structureTransformation = row.structureTransformations.find(
      (candidate) => candidate.id === structureTransformationId
    );
    const creationForm = structureTransformation?.forms.find(
      (form) =>
        form.formDefinition.slug === "structure-transformation-creation-v1"
    );
    expect(creationForm).toBeDefined();
    expect(
      creationForm?.formSteps.map((formStep) => formStep.stepDefinition.slug)
    ).toEqual(
      expect.arrayContaining([
        "01-identification",
        "02-places-hebergement",
        "03-actes-administratifs",
      ])
    );
  });
});
