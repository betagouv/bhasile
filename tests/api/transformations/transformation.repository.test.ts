import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOne,
  findOne,
  updateOne,
} from "@/app/api/transformations/transformation.repository";
import {
  createTransformation,
  getTransformation,
  resetTransformationSelection,
} from "@/app/api/transformations/transformation.service";
import { getNormalizedRegionCodeFromDepartement } from "@/app/utils/bhasile.util";
import prisma from "@/lib/prisma";
import { Repartition } from "@/types/adresse.type";
import { PublicType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
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
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const structureVersionTransformation =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    if (!structureVersionTransformation.structureVersion) {
      throw new Error("StructureVersion should be created with transfo");
    }
    return {
      transformationId,
      structureVersionTransformationId: structureVersionTransformation.id,
      structureVersionId: structureVersionTransformation.structureVersion.id,
      structureId: structure.id,
    };
  };

  const findDepartementWithRegionCode = () =>
    prisma.departement.findFirstOrThrow({
      where: { regionAdministrative: { code: { not: "" } } },
    });

  const finalizeTransformation = async (transformationId: number) => {
    await prisma.structureVersion.updateMany({
      where: {
        structureVersionTransformation: { transformationId },
        effectiveDate: null,
      },
      data: { effectiveDate: new Date("2024-01-01T00:00:00.000Z") },
    });
    const formRow = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    const formDefinition = await prisma.formDefinition.findUniqueOrThrow({
      where: { id: formRow.formDefinitionId },
    });
    return updateOne({
      id: transformationId,
      form: {
        id: formRow.id,
        status: true,
        formDefinition: {
          id: formDefinition.id,
          slug: formDefinition.slug,
          name: formDefinition.name,
          version: formDefinition.version,
        },
        formSteps: [],
      },
    });
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
      await prisma.structureVersionTransformation.deleteMany({
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

  it("should persist transformation, structureVersionTransformations and initial form on createOne", async () => {
    const structure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: {
        structureVersionTransformations: { include: { structureVersion: true } },
        form: { include: { formDefinition: true } },
      },
    });
    expect(transformation.type).toBe(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    expect(transformation.structureVersionTransformations).toHaveLength(1);
    expect(transformation.structureVersionTransformations[0].type).toBe(
      StructureVersionTransformationType.EXTENSION
    );
    expect(
      transformation.structureVersionTransformations[0].structureVersion?.structureId
    ).toBe(structure.id);
    expect(transformation.form).not.toBeNull();
    expect(transformation.form?.formDefinition.slug).toBe("transformation-v1");
  });

  it("should return nested includes from findOne after createOne", async () => {
    const { transformationId } = await createBareTransformation();
    const row = await findOne(transformationId);
    expect(row.id).toBe(transformationId);
    expect(row.structureVersionTransformations.length).toBeGreaterThanOrEqual(1);
    expect(row.structureVersionTransformations[0].structureVersion).toBeDefined();
    expect(
      row.structureVersionTransformations[0].structureVersion?.structure
    ).toBeDefined();
    expect(row.form?.formDefinition).toBeDefined();
  });

  it("should update transformation, structureVersionTransformation and structureVersion scalar fields in one updateOne call", async () => {
    const { transformationId, structureVersionTransformationId, structureVersionId } =
      await createBareTransformation();
    const departement = await prisma.departement.findFirstOrThrow();

    await updateOne({
      id: transformationId,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
          type: StructureVersionTransformationType.FERMETURE,
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

    const st = await prisma.structureVersionTransformation.findUniqueOrThrow({
      where: { id: structureVersionTransformationId },
      include: { structureVersion: true },
    });
    expect(st.type).toBe(StructureVersionTransformationType.FERMETURE);
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

  it("should persist a provided structureVersion.effectiveDate on updateOne", async () => {
    const { transformationId, structureVersionTransformationId, structureVersionId } =
      await createBareTransformation();
    const fermetureDate = "2024-09-30T00:00:00.000Z";

    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: {
            id: structureVersionId,
            effectiveDate: fermetureDate,
          },
        },
      ],
    });

    const structureVersion = await prisma.structureVersion.findUniqueOrThrow({
      where: { id: structureVersionId },
    });
    expect(structureVersion.effectiveDate?.toISOString()).toBe(fermetureDate);
  });

  it("should replace structureVersion contacts on updateOne", async () => {
    const { transformationId, structureVersionTransformationId, structureVersionId } =
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
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
    const { transformationId, structureVersionTransformationId, structureVersionId } =
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
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
    const { transformationId, structureVersionTransformationId, structureVersionId } =
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
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
    const { transformationId, structureVersionTransformationId, structureVersionId } =
      await createBareTransformation();
    await prisma.structureFiness.create({
      data: {
        structureVersion: { connect: { id: structureVersionId } },
        finess: {
          create: { code: `FIN-OLD-TF-${Date.now()}-${randomUUID()}` },
        },
      },
    });
    const newCode = `FIN-NEW-TF-${Date.now()}-${randomUUID()}`;
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
          structureVersion: {
            id: structureVersionId,
            structureFinesses: [
              { description: "finess transfo", finess: { code: newCode } },
            ],
          },
        },
      ],
    });
    const structureFinesses = await prisma.structureFiness.findMany({
      where: { structureVersionId },
      include: { finess: true },
    });
    expect(structureFinesses).toHaveLength(1);
    expect(structureFinesses[0].finess.code).toBe(newCode);
    expect(structureFinesses[0].description).toBe("finess transfo");
  });

  it("should upsert structureVersion structureTypologies by year on updateOne", async () => {
    const { transformationId, structureVersionTransformationId, structureVersionId } =
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
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
    const { transformationId, structureVersionTransformationId, structureVersionId } =
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
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
          structureVersion: {
            id: structureVersionId,
            dnaStructures: [
              { description: "Desc transfo", dna: { code: newCode } },
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
    expect(links[0].description).toBe("Desc transfo");
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

    await finalizeTransformation(transformationId);
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

  it("should reject finalization when a structureVersion has no effectiveDate", async () => {
    const { transformationId } = await createBareTransformation();
    const formRow = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    const formDefinition = await prisma.formDefinition.findUniqueOrThrow({
      where: { id: formRow.formDefinitionId },
    });

    await expect(
      updateOne({
        id: transformationId,
        form: {
          id: formRow.id,
          status: true,
          formDefinition: {
            id: formDefinition.id,
            slug: formDefinition.slug,
            name: formDefinition.name,
            version: formDefinition.version,
          },
          formSteps: [],
        },
      })
    ).rejects.toThrow("date d'effet");

    const form = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    expect(form.status).toBe(false);
  });

  it("should persist operateurId on structureVersionTransformation when creating", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const st = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    expect(st.operateurId).toBe(operateur.id);
  });

  it("should default operateurId to null when not provided on createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const st = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    expect(st.operateurId).toBeNull();
  });

  it("should NOT initialize a StructureVersion when structureVersion is not provided to createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const structureVersionTransformation =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
      });
    const structureVersion = await prisma.structureVersion.findFirst({
      where: { structureVersionTransformationId: structureVersionTransformation.id },
    });
    expect(structureVersion).toBeNull();
  });

  it("should initialize default forms for each structureVersionTransformation on createOne", async () => {
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const structureVersionTransformation =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
      });
    const formCount = await prisma.form.count({
      where: { structureVersionTransformationId: structureVersionTransformation.id },
    });
    expect(formCount).toBeGreaterThan(0);
  });

  it("should update operateurId on updateOne", async () => {
    const operateurA = await createOperateur();
    const operateurB = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateurA.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    await updateOne({
      id: transformationId,
      structureVersionTransformations: [{ id: st.id, operateurId: operateurB.id }],
    });

    const updated = await prisma.structureVersionTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBe(operateurB.id);
  });

  it("should clear operateurId when explicitly set to null on updateOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    await updateOne({
      id: transformationId,
      structureVersionTransformations: [{ id: st.id, operateurId: null }],
    });

    const updated = await prisma.structureVersionTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBeNull();
  });

  it("should leave operateurId unchanged when omitted on updateOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    const st = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });

    // Update some other field without touching operateurId
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [{ id: st.id, motif: "Untouched operateur" }],
    });

    const updated = await prisma.structureVersionTransformation.findUniqueOrThrow({
      where: { id: st.id },
    });
    expect(updated.operateurId).toBe(operateur.id);
    expect(updated.motif).toBe("Untouched operateur");
  });

  it("should return operateur narrowed to { id, name } from findOne", async () => {
    const operateur = await createOperateur();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const row = await findOne(transformationId);
    const fetchedOperateur = row.structureVersionTransformations[0].operateur;
    expect(fetchedOperateur).toEqual({
      id: operateur.id,
      name: operateur.name,
    });
    // Ensure narrow shape: no siret, siegeSocial, createdAt, etc.
    expect(Object.keys(fetchedOperateur ?? {}).sort()).toEqual(["id", "name"]);
  });

  it("should create a new structureVersionTransformation when updateOne omits id but provides structureVersion.structureId and type", async () => {
    const structureA = await createStructure();
    const structureB = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { structureId: structureA.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: structureB.id },
        },
      ],
    });

    const rows = await prisma.structureVersionTransformation.findMany({
      where: { transformationId },
      include: { structureVersion: true },
      orderBy: { id: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.structureVersion?.structureId).sort()).toEqual(
      [structureA.id, structureB.id].sort()
    );
    const created = rows.find(
      (r) => r.structureVersion?.structureId === structureB.id
    );
    expect(created?.type).toBe(StructureVersionTransformationType.EXTENSION);
  });

  it("should persist and read back actesAdministratifs on a structureVersionTransformation via updateOne/findOne", async () => {
    const { transformationId, structureVersionTransformationId } =
      await createBareTransformation();
    const file = await createFileUpload("acte");

    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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

    // persisted on the structureVersionTransformation
    const persisted = await prisma.acteAdministratif.findMany({
      where: { structureVersionTransformationId },
      include: { fileUploads: true },
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0].category).toBe("ARRETE_AUTORISATION");
    expect(persisted[0].fileUploads).toMatchObject([{ key: file.key }]);

    // read back through the findOne include
    const row = await findOne(transformationId);
    const structureVersionTransformation = row.structureVersionTransformations.find(
      (candidate) => candidate.id === structureVersionTransformationId
    );
    expect(structureVersionTransformation?.actesAdministratifs).toHaveLength(1);
    expect(structureVersionTransformation?.actesAdministratifs[0].category).toBe(
      "ARRETE_AUTORISATION"
    );
    expect(
      structureVersionTransformation?.actesAdministratifs[0].fileUploads
    ).toMatchObject([{ key: file.key }]);
  });

  it("should delete structureVersionTransformation actesAdministratifs that are no longer present (scoped cleanup)", async () => {
    const { transformationId, structureVersionTransformationId } =
      await createBareTransformation();
    const keptFile = await createFileUpload("keep");
    const droppedFile = await createFileUpload("drop");

    // first save: two actes
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
        where: { structureVersionTransformationId },
      })
    ).toBe(2);

    // second save: only the first acte remains
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: structureVersionTransformationId,
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
      where: { structureVersionTransformationId },
      include: { fileUploads: true },
    });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].category).toBe("ARRETE_AUTORISATION");
    expect(remaining[0].fileUploads).toMatchObject([{ key: keptFile.key }]);
  });

  const seedRichStructure = async () => {
    const structure = await createStructure();
    const contact = await prisma.contact.create({
      data: {
        structureId: structure.id,
        prenom: "Nicolas",
        nom: "Leboeuf",
        telephone: "0652464214",
        email: "nicolas.leboeuf@lesmimosas.fr",
        role: "Responsable structure",
        perimetre: "Toutes les antennes",
      },
    });
    const antenne = await prisma.antenne.create({
      data: {
        structureId: structure.id,
        name: "Avranches Nord",
        adresse: "2 rue B",
        codePostal: "50300",
        commune: "Avranches",
        departement: "50",
      },
    });
    const adresse = await prisma.adresse.create({
      data: {
        structureId: structure.id,
        adresse: "3 rue C",
        codePostal: "50300",
        commune: "Avranches",
        repartition: Repartition.COLLECTIF,
        placesAutorisees: 10,
        qpv: 0,
        logementSocial: 0,
      },
    });
    await prisma.adresseTypologie.create({
      data: {
        adresseId: adresse.id,
        placesAutorisees: 10,
        year: 2024,
        qpv: 0,
        logementSocial: 0,
      },
    });
    const dna = await prisma.dna.create({
      data: { code: `DNA-TF-TEST-${randomUUID()}` },
    });
    await prisma.dnaStructure.create({
      data: { structureId: structure.id, dnaId: dna.id },
    });
    const structureFiness = await prisma.structureFiness.create({
      data: {
        structure: { connect: { id: structure.id } },
        finess: {
          create: { code: `FIN-TF-TEST-${randomUUID()}` },
        },
      },
    });
    return {
      structure,
      contactId: contact.id,
      antenneId: antenne.id,
      dnaId: dna.id,
      finessId: structureFiness.finessId,
    };
  };

  const versionRelationsInclude = {
    structureVersion: {
      include: {
        contacts: true,
        antennes: true,
        adresses: { include: { adresseTypologies: true } },
        dnaStructures: true,
        structureFinesses: true,
      },
    },
  } as const;

  it("should copy the source structure data into the new structureVersion on createOne (layer A)", async () => {
    const { structure, contactId, antenneId, dnaId, finessId } =
      await seedRichStructure();

    const transformationId = await createTransformation({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: structure.id },
        },
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const fermeture = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId, type: StructureVersionTransformationType.FERMETURE },
      include: versionRelationsInclude,
    });
    const version = fermeture.structureVersion;
    if (!version) {
      throw new Error("La version de la fermeture devrait exister");
    }

    expect(version.contacts).toHaveLength(1);
    expect(version.contacts[0].nom).toBe("Leboeuf");
    expect(version.contacts[0].id).not.toBe(contactId);
    expect(version.antennes).toHaveLength(1);
    expect(version.antennes[0].id).not.toBe(antenneId);
    expect(version.adresses).toHaveLength(1);
    expect(version.adresses[0].adresseTypologies).toHaveLength(1);

    // dnaStructures : nouvelle ligne de jonction, mais même Dna réutilisé.
    expect(version.dnaStructures).toHaveLength(1);
    expect(version.dnaStructures[0].dnaId).toBe(dnaId);
    expect(version.dnaStructures[0].structureId).toBeNull();
    const dnaCount = await prisma.dna.count({ where: { id: dnaId } });
    expect(dnaCount).toBe(1);

    // structureFinesses : nouvelle ligne de jonction, mais même Finess réutilisé.
    expect(version.structureFinesses).toHaveLength(1);
    expect(version.structureFinesses[0].finessId).toBe(finessId);
    expect(version.structureFinesses[0].structureId).toBeNull();
    const finessCount = await prisma.finess.count({ where: { id: finessId } });
    expect(finessCount).toBe(1);

    // La structure source n'est pas modifiée.
    const sourceContacts = await prisma.contact.findMany({
      where: { structureId: structure.id },
    });
    expect(sourceContacts).toHaveLength(1);
    expect(sourceContacts[0].id).toBe(contactId);
  });

  it("should prefill the CREATION structureVersion from the closing structure (layer B)", async () => {
    const { structure } = await seedRichStructure();

    const transformationId = await createTransformation({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: structure.id },
        },
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const creation = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId, type: StructureVersionTransformationType.CREATION },
      include: versionRelationsInclude,
    });
    const version = creation.structureVersion;
    if (!version) {
      throw new Error("La version de la création devrait exister");
    }

    expect(version.contacts).toHaveLength(1);
    expect(version.contacts[0].nom).toBe("Leboeuf");
    expect(version.antennes).toHaveLength(1);
    expect(version.antennes[0].name).toBe("Avranches Nord");
    expect(version.adresses).toHaveLength(1);
    expect(version.adresses[0].adresseTypologies).toHaveLength(1);
  });

  it("should accumulate data from several closing structures additively (layer B)", async () => {
    const first = await seedRichStructure();
    const second = await seedRichStructure();

    const transformationId = await createTransformation({
      type: TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: first.structure.id },
        },
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: second.structure.id },
        },
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    createdTransformationIds.push(transformationId);

    const creation = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId, type: StructureVersionTransformationType.CREATION },
      include: versionRelationsInclude,
    });

    expect(creation.structureVersion?.contacts).toHaveLength(2);
    expect(creation.structureVersion?.antennes).toHaveLength(2);
    expect(creation.structureVersion?.adresses).toHaveLength(2);
  });

  it("should return structureVersionTransformation forms with their steps from findOne", async () => {
    const { transformationId, structureVersionTransformationId } =
      await createBareTransformation();

    const row = await findOne(transformationId);
    const structureVersionTransformation = row.structureVersionTransformations.find(
      (candidate) => candidate.id === structureVersionTransformationId
    );
    const creationForm = structureVersionTransformation?.form;
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

  it("should create a Structure and link the floating structureVersion when finalizing a CREATION block", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: {
            departementAdministratif: departement.numero,
            nom: "Nouvelle structure issue d'une transfo",
          },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);

    const structureVersionTransformation =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    const structureId =
      structureVersionTransformation.structureVersion?.structureId;
    if (!structureId) {
      throw new Error(
        "La structureVersion devrait être rattachée à une structure"
      );
    }

    const structure = await prisma.structure.findUniqueOrThrow({
      where: { id: structureId },
    });
    createdStructureIds.push(structure.id);
    expect(structure.operateurId).toBe(operateur.id);
    const expectedRegionCode = getNormalizedRegionCodeFromDepartement(
      departement.numero
    );
    expect(expectedRegionCode).toBeTruthy();
    expect(structure.codeBhasile.split("-")).toEqual([
      "BHA",
      expectedRegionCode,
      expect.stringMatching(/^\d{3}$/),
    ]);
  });

  it("should set the new Structure creationDate from the version effectiveDate when finalizing a CREATION block", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const creationDate = "2022-05-04T00:00:00.000Z";
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: {
            departementAdministratif: departement.numero,
            effectiveDate: creationDate,
          },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
      include: { structureVersion: true },
    });
    const structureId = block.structureVersion?.structureId;
    if (!structureId) {
      throw new Error(
        "La structureVersion devrait être rattachée à une structure"
      );
    }

    const structure = await prisma.structure.findUniqueOrThrow({
      where: { id: structureId },
    });
    createdStructureIds.push(structure.id);
    // creationDate immuable : dérivée de l'effectiveDate de la version, posée sur la Structure
    expect(structure.creationDate?.toISOString()).toBe(creationDate);
    expect(structure.date303).toBeNull();
  });

  it("should reject any update on an already finalized transformation", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);
    const finalizedBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    if (finalizedBlock.structureVersion?.structureId) {
      createdStructureIds.push(finalizedBlock.structureVersion.structureId);
    }

    await expect(
      updateOne({
        id: transformationId,
        type: TransformationType.EXTENSION_EX_NIHILO,
      })
    ).rejects.toThrow("finalisée");
  });

  it("should abort and roll back the finalization when a CREATION block has no operateur", async () => {
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await expect(finalizeTransformation(transformationId)).rejects.toThrow(
      "opérateur"
    );

    const form = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    expect(form.status).toBe(false);
    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
      include: { structureVersion: true },
    });
    expect(block.structureVersion?.structureId).toBeNull();
  });

  it("should ignore non-CREATION blocks when finalizing", async () => {
    const sourceStructure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: sourceStructure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);

    const fermetureBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    expect(fermetureBlock.structureVersion?.structureId).toBe(
      sourceStructure.id
    );
  });

  it("should move a CREATION block's actesAdministratifs onto the newly created structure on finalization", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    const file = await createFileUpload("acte-creation");
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: block.id,
          actesAdministratifs: [
            { category: "ARRETE_AUTORISATION", fileUploads: [{ key: file.key }] },
          ],
        },
      ],
    });

    await finalizeTransformation(transformationId);

    const refreshedBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    const structureId = refreshedBlock.structureVersion?.structureId;
    if (!structureId) {
      throw new Error(
        "La structureVersion devrait être rattachée à une structure"
      );
    }
    createdStructureIds.push(structureId);

    const actes = await prisma.acteAdministratif.findMany({
      where: { structureId },
    });
    expect(actes).toHaveLength(1);
    expect(actes[0].category).toBe("ARRETE_AUTORISATION");
    expect(actes[0].structureVersionTransformationId).toBeNull();
    expect(
      await prisma.acteAdministratif.count({
        where: { structureVersionTransformationId: block.id },
      })
    ).toBe(0);
  });

  it("should move a non-CREATION block's actesAdministratifs onto its existing structure on finalization", async () => {
    const sourceStructure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: sourceStructure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    const file = await createFileUpload("acte-fermeture");
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: block.id,
          actesAdministratifs: [
            { category: "CONVENTION", fileUploads: [{ key: file.key }] },
          ],
        },
      ],
    });

    await finalizeTransformation(transformationId);

    const actes = await prisma.acteAdministratif.findMany({
      where: { structureId: sourceStructure.id },
    });
    expect(actes).toHaveLength(1);
    expect(actes[0].category).toBe("CONVENTION");
    expect(actes[0].structureVersionTransformationId).toBeNull();
    expect(
      await prisma.acteAdministratif.count({
        where: { structureVersionTransformationId: block.id },
      })
    ).toBe(0);
  });

  it("should move avenants (children) along with their parent acte on finalization", async () => {
    const sourceStructure = await createStructure();
    const transformationId = await createOne({
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: sourceStructure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    const parentFile = await createFileUpload("acte-parent");
    const avenantFile = await createFileUpload("acte-avenant");
    const parentUuid = randomUUID();
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: block.id,
          actesAdministratifs: [
            {
              uuid: parentUuid,
              category: "ARRETE_AUTORISATION",
              fileUploads: [{ key: parentFile.key }],
            },
            {
              parentUuid,
              category: "AUTRE",
              fileUploads: [{ key: avenantFile.key }],
            },
          ],
        },
      ],
    });

    await finalizeTransformation(transformationId);

    const actes = await prisma.acteAdministratif.findMany({
      where: { structureId: sourceStructure.id },
    });
    expect(actes).toHaveLength(2);
    expect(
      actes.every((acte) => acte.structureVersionTransformationId === null)
    ).toBe(true);
    const parent = actes.find((acte) => acte.parentId === null);
    const avenant = actes.find((acte) => acte.parentId !== null);
    expect(parent).toBeDefined();
    expect(avenant?.parentId).toBe(parent?.id);
  });

  it("should throw and roll back finalization when a block has actes but no resolvable target structure", async () => {
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const block = await prisma.structureVersionTransformation.findFirstOrThrow({
      where: { transformationId },
    });
    const file = await createFileUpload("acte-orphan");
    await updateOne({
      id: transformationId,
      structureVersionTransformations: [
        {
          id: block.id,
          actesAdministratifs: [
            { category: "AUTRE", fileUploads: [{ key: file.key }] },
          ],
        },
      ],
    });

    await expect(finalizeTransformation(transformationId)).rejects.toThrow(
      "non basculable"
    );

    const form = await prisma.form.findFirstOrThrow({
      where: { transformationId },
    });
    expect(form.status).toBe(false);
    expect(
      await prisma.acteAdministratif.count({
        where: { structureVersionTransformationId: block.id },
      })
    ).toBe(1);
  });

  it("should generate distinct bhasile codes for multiple CREATION blocks in the same region", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);

    const creationBlocks = await prisma.structureVersionTransformation.findMany({
      where: {
        transformationId,
        type: StructureVersionTransformationType.CREATION,
      },
      include: { structureVersion: true },
    });
    const structureIds = creationBlocks
      .map((creationBlock) => creationBlock.structureVersion?.structureId)
      .filter((structureId): structureId is number => structureId != null);
    expect(structureIds).toHaveLength(2);
    expect(new Set(structureIds).size).toBe(2);

    const structures = await prisma.structure.findMany({
      where: { id: { in: structureIds } },
    });
    structures.forEach((structure) => createdStructureIds.push(structure.id));
    const codesBhasile = structures.map((structure) => structure.codeBhasile);
    expect(new Set(codesBhasile).size).toBe(2);
    codesBhasile.forEach((codeBhasile) =>
      expect(codeBhasile.split("-")).toHaveLength(3)
    );
  });

  it("should not create a second Structure when a finalized transformation is re-submitted", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    await finalizeTransformation(transformationId);
    const blockAfterFirstFinalize =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    const linkedStructureId =
      blockAfterFirstFinalize.structureVersion?.structureId;
    if (!linkedStructureId) {
      throw new Error("La première finalisation aurait dû créer une structure");
    }
    createdStructureIds.push(linkedStructureId);

    await expect(finalizeTransformation(transformationId)).rejects.toThrow(
      "finalisée"
    );

    const blockAfterSecondFinalize =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    expect(blockAfterSecondFinalize.structureVersion?.structureId).toBe(
      linkedStructureId
    );
    const structureCountForOperateur = await prisma.structure.count({
      where: { operateurId: operateur.id },
    });
    expect(structureCountForOperateur).toBe(1);
  });

  // --- Lecture transfo : la source résolue = le prédécesseur de la transfo ---

  const createStructureWithInitVersion = async (
    effectiveDate: string,
    versionData: Record<string, unknown> = {}
  ) => {
    const structure = await createStructure();
    const version = await prisma.structureVersion.create({
      data: {
        structureId: structure.id,
        effectiveDate: new Date(effectiveDate),
        ...versionData,
      },
    });
    return { structure, version };
  };

  const createExtensionTransfo = async (
    structureId: number,
    effectiveDate: string
  ) => {
    const transformationId = await createOne({
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId, effectiveDate },
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    return transformationId;
  };

  it("should resolve the predecessor (init) onto structureVersion.structure when the transfo is dated after it", async () => {
    const { structure, version } = await createStructureWithInitVersion(
      "2024-01-01T12:00:00.000Z",
      { nom: "Nom de la version source" }
    );
    await prisma.structureTypologie.create({
      data: { structureVersionId: version.id, year: 2024, placesAutorisees: 30 },
    });

    const transformationId = await createExtensionTransfo(
      structure.id,
      "2024-06-01T12:00:00.000Z"
    );

    const transformation = await getTransformation(transformationId);
    const sourceStructure =
      transformation?.structureVersionTransformations[0].structureVersion
        ?.structure;
    expect(sourceStructure?.nom).toBe("Nom de la version source");
    expect(sourceStructure?.structureTypologies?.[0]?.placesAutorisees).toBe(30);
  });

  it("should resolve no predecessor when the transfo is dated before the init version", async () => {
    const { structure } = await createStructureWithInitVersion(
      "2024-09-01T12:00:00.000Z",
      { nom: "Nom de la version source" }
    );

    const transformationId = await createExtensionTransfo(
      structure.id,
      "2024-03-01T12:00:00.000Z"
    );

    const transformation = await getTransformation(transformationId);
    const sourceStructure =
      transformation?.structureVersionTransformations[0].structureVersion
        ?.structure;
    expect(sourceStructure?.nom ?? null).toBeNull();
    expect(sourceStructure?.structureTypologies ?? []).toHaveLength(0);
  });

  // --- Reset de sélection : full replace + cascade ---

  it("should wipe the previous selection subtree (svt, version, forms, actes) and recreate from the new selection", async () => {
    const { transformationId, structureVersionTransformationId, structureVersionId } =
      await createBareTransformation();
    const oldActe = await prisma.acteAdministratif.create({
      data: {
        structureVersionTransformationId,
        category: "ARRETE_AUTORISATION",
      },
    });
    expect(
      await prisma.form.count({
        where: { structureVersionTransformationId },
      })
    ).toBeGreaterThan(0);

    const closingStructure = await createStructure();
    await resetTransformationSelection({
      id: transformationId,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: closingStructure.id },
        },
      ],
    });

    // Ancien sous-arbre effacé (cascade).
    expect(
      await prisma.structureVersionTransformation.findUnique({
        where: { id: structureVersionTransformationId },
      })
    ).toBeNull();
    expect(
      await prisma.structureVersion.findUnique({
        where: { id: structureVersionId },
      })
    ).toBeNull();
    expect(
      await prisma.form.count({
        where: { structureVersionTransformationId },
      })
    ).toBe(0);
    expect(
      await prisma.acteAdministratif.findUnique({ where: { id: oldActe.id } })
    ).toBeNull();

    // Nouvelle sélection en place.
    const transformation = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: {
        structureVersionTransformations: { include: { structureVersion: true } },
      },
    });
    expect(transformation.type).toBe(TransformationType.FERMETURE_SANS_TRANSFERT);
    expect(transformation.structureVersionTransformations).toHaveLength(1);
    expect(transformation.structureVersionTransformations[0].type).toBe(
      StructureVersionTransformationType.FERMETURE
    );
    expect(
      transformation.structureVersionTransformations[0].structureVersion
        ?.structureId
    ).toBe(closingStructure.id);
  });

  it("should rebuild the source block with a fresh version and forms (no leftover step data)", async () => {
    const { structure } = await seedRichStructure();
    const transformationId = await createTransformation({
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });
    createdTransformationIds.push(transformationId);

    const beforeBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    const oldVersionId = beforeBlock.structureVersion?.id;

    await resetTransformationSelection({
      id: transformationId,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: structure.id },
        },
      ],
    });

    const afterBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: { include: { contacts: true } } },
      });

    // Identité de la source préservée, ligne SVT + version reconstruites.
    expect(afterBlock.id).not.toBe(beforeBlock.id);
    expect(afterBlock.structureVersion?.id).not.toBe(oldVersionId);
    expect(afterBlock.structureVersion?.structureId).toBe(structure.id);
    if (oldVersionId) {
      expect(
        await prisma.structureVersion.findUnique({ where: { id: oldVersionId } })
      ).toBeNull();
    }
    // Version fraîche re-copiée depuis la structure source.
    expect(afterBlock.structureVersion?.contacts).toHaveLength(1);
    expect(
      await prisma.form.count({
        where: { structureVersionTransformationId: afterBlock.id },
      })
    ).toBeGreaterThan(0);
  });

  it("should reject reset on an already finalized transformation", async () => {
    const operateur = await createOperateur();
    const departement = await findDepartementWithRegionCode();
    const transformationId = await createOne({
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
          operateurId: operateur.id,
          structureVersion: { departementAdministratif: departement.numero },
        },
      ],
    });
    createdTransformationIds.push(transformationId);
    await finalizeTransformation(transformationId);
    const finalizedBlock =
      await prisma.structureVersionTransformation.findFirstOrThrow({
        where: { transformationId },
        include: { structureVersion: true },
      });
    if (finalizedBlock.structureVersion?.structureId) {
      createdStructureIds.push(finalizedBlock.structureVersion.structureId);
    }

    const closingStructure = await createStructure();
    await expect(
      resetTransformationSelection({
        id: transformationId,
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureVersionTransformations: [
          {
            type: StructureVersionTransformationType.FERMETURE,
            structureVersion: { structureId: closingStructure.id },
          },
        ],
      })
    ).rejects.toThrow("finalisée");
  });

  it("should be idempotent on selection state when replayed with the same input", async () => {
    const { transformationId } = await createBareTransformation();
    const closingStructure = await createStructure();
    const selection = {
      id: transformationId,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: closingStructure.id },
        },
      ],
    };

    await resetTransformationSelection(selection);
    const firstState = await readSelectionState(transformationId);

    await resetTransformationSelection(selection);
    const secondState = await readSelectionState(transformationId);

    expect(secondState).toEqual(firstState);
  });
});

const readSelectionState = async (transformationId: number) => {
  const transformation = await prisma.transformation.findUniqueOrThrow({
    where: { id: transformationId },
    include: {
      structureVersionTransformations: { include: { structureVersion: true } },
    },
  });
  return {
    type: transformation.type,
    blocks: transformation.structureVersionTransformations
      .map((structureVersionTransformation) => ({
        type: structureVersionTransformation.type,
        structureId:
          structureVersionTransformation.structureVersion?.structureId ?? null,
      }))
      .sort((first, second) =>
        `${first.type}:${first.structureId}`.localeCompare(
          `${second.type}:${second.structureId}`
        )
      ),
  };
};
