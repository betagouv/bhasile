import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { updateOne } from "@/app/api/structures/structure.repository";
import prisma from "@/lib/prisma";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { Repartition } from "@/types/adresse.type";
import { ControleType } from "@/types/controle.type";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";
import { StepStatus } from "@/types/form.type";
import { PublicType, StructureType } from "@/types/structure.type";

describe("structure.repository db integration", () => {
  const createdStructureIds: number[] = [];
  const createdOperateurIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DB-TEST-${Date.now()}-${Math.random()}`,
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createFileUpload = async (prefix: string) => {
    return prisma.fileUpload.create({
      data: {
        key: `${prefix}-${Date.now()}-${randomUUID()}`,
        mimeType: "application/pdf",
        fileSize: 42,
        originalName: `${prefix}.pdf`,
      },
    });
  };

  afterAll(async () => {
    if (createdStructureIds.length > 0) {
      await prisma.structure.deleteMany({
        where: {
          id: {
            in: createdStructureIds,
          },
        },
      });
    }

    if (createdOperateurIds.length > 0) {
      await prisma.operateur.deleteMany({
        where: {
          id: {
            in: createdOperateurIds,
          },
        },
      });
    }
  });

  it("should update all structure scalar fields in one call", async () => {
    // GIVEN: an empty structure
    const structure = await createStructure();
    const creationDate = "2020-02-02T00:00:00.000Z";
    const date303 = "2021-03-03T00:00:00.000Z";
    const debutConvention = "2022-04-04T00:00:00.000Z";
    const finConvention = "2023-05-05T00:00:00.000Z";
    const debutPeriodeAutorisation = "2024-06-06T00:00:00.000Z";
    const finPeriodeAutorisation = "2025-07-07T00:00:00.000Z";

    // WHEN: all scalar fields are sent in a single update
    await updateOne({
      id: structure.id,
      public: PublicType.FAMILLE,
      adresseAdministrative: "10 rue de la Paix",
      codePostalAdministratif: "75001",
      communeAdministrative: "Paris",
      filiale: "Filiale test",
      type: StructureType.CADA,
      latitude: "48.8566",
      longitude: "2.3522",
      nom: "Structure test complete",
      date303,
      debutConvention,
      finConvention,
      creationDate,
      lgbt: true,
      fvvTeh: false,
      debutPeriodeAutorisation,
      finPeriodeAutorisation,
      notes: "Notes de test",
      nomOfii: "Nom OFII",
      directionTerritoriale: "DT75",
    });

    // THEN: every scalar field is persisted
    const updated = await prisma.structure.findUniqueOrThrow({
      where: { id: structure.id },
    });
    expect(updated.public).toBe("FAMILLE");
    expect(updated.adresseAdministrative).toBe("10 rue de la Paix");
    expect(updated.codePostalAdministratif).toBe("75001");
    expect(updated.communeAdministrative).toBe("Paris");
    expect(updated.filiale).toBe("Filiale test");
    expect(updated.type).toBe(StructureType.CADA);
    expect(updated.latitude?.toString()).toBe("48.8566");
    expect(updated.longitude?.toString()).toBe("2.3522");
    expect(updated.nom).toBe("Structure test complete");
    expect(updated.date303?.toISOString()).toBe(date303);
    expect(updated.debutConvention?.toISOString()).toBe(debutConvention);
    expect(updated.finConvention?.toISOString()).toBe(finConvention);
    expect(updated.creationDate?.toISOString()).toBe(creationDate);
    expect(updated.lgbt).toBe(true);
    expect(updated.fvvTeh).toBe(false);
    expect(updated.debutPeriodeAutorisation?.toISOString()).toBe(
      debutPeriodeAutorisation
    );
    expect(updated.finPeriodeAutorisation?.toISOString()).toBe(
      finPeriodeAutorisation
    );
    expect(updated.notes).toBe("Notes de test");
    expect(updated.nomOfii).toBe("Nom OFII");
    expect(updated.directionTerritoriale).toBe("DT75");
  });

  it("should update departementAdministratif relation", async () => {
    // GIVEN: a structure and an existing department
    const structure = await createStructure();
    const departement = await prisma.departement.findFirstOrThrow();

    // WHEN: department number is updated
    await updateOne({
      id: structure.id,
      departementAdministratif: departement.numero,
    });

    // THEN: structure references the expected department
    const updated = await prisma.structure.findUniqueOrThrow({
      where: { id: structure.id },
    });
    expect(updated.departementAdministratif).toBe(departement.numero);
  });

  it("should update operateur relation", async () => {
    // GIVEN: a structure and a dedicated operateur
    const structure = await createStructure();
    const operateur = await prisma.operateur.create({
      data: { name: `Operateur-test-${Date.now()}-${Math.random()}` },
    });
    createdOperateurIds.push(operateur.id);

    // WHEN: operateur is connected
    await updateOne({
      id: structure.id,
      operateur: { id: operateur.id, name: operateur.name },
    });

    // THEN: relation is updated
    const updated = await prisma.structure.findUniqueOrThrow({
      where: { id: structure.id },
    });
    expect(updated.operateurId).toBe(operateur.id);
  });

  it("should replace structure contacts on update", async () => {
    // GIVEN: a structure with two existing contacts
    const structure = await createStructure();

    await prisma.contact.createMany({
      data: [
        {
          structureId: structure.id,
          prenom: "Alice",
          nom: "Legacy",
          email: "alice.legacy@example.test",
          telephone: "0100000001",
          role: "Ancien role",
          perimetre: "Ancien perimetre",
        },
        {
          structureId: structure.id,
          prenom: "Bob",
          nom: "Legacy",
          email: "bob.legacy@example.test",
          telephone: "0100000002",
          role: "Ancien role",
          perimetre: "Ancien perimetre",
        },
      ],
    });

    // WHEN: updateOne receives a new contact list
    const newContact = {
      prenom: "Claire",
      nom: "Nouvelle",
      email: "claire@example.test",
      telephone: "0100000100",
      role: "Direction",
      perimetre: "National",
    };
    await updateOne(
      {
        id: structure.id,
        contacts: [newContact],
      },
      false
    );

    // THEN: old contacts are removed and replaced by the new list
    const contacts = await prisma.contact.findMany({
      where: { structureId: structure.id },
      orderBy: { id: "asc" },
    });

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(newContact);
  });

  it("should upsert structure budgets by year", async () => {
    // GIVEN: an existing budget
    const structure = await createStructure();
    await prisma.budget.create({
      data: {
        structureId: structure.id,
        year: 2024,
        commentaire: "old",
      },
    });

    // WHEN: same year is sent with new values
    await updateOne({
      id: structure.id,
      budgets: [{ year: 2024, commentaire: "new" }],
    });

    // THEN: budget row is updated in place
    const budgets = await prisma.budget.findMany({
      where: { structureId: structure.id },
    });
    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({
      year: 2024,
      commentaire: "new",
    });
  });

  it("should upsert indicateursFinanciers by year and type", async () => {
    // GIVEN: one existing indicateur
    const structure = await createStructure();
    await prisma.indicateurFinancier.create({
      data: {
        structureId: structure.id,
        year: 2024,
        type: "PREVISIONNEL",
        ETP: 1,
      },
    });

    // WHEN: same key is updated
    await updateOne({
      id: structure.id,
      indicateursFinanciers: [
        {
          year: 2024,
          type: "PREVISIONNEL",
          ETP: 3,
          coutJournalier: 15,
        },
      ],
    });

    // THEN: row is updated
    const rows = await prisma.indicateurFinancier.findMany({
      where: { structureId: structure.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      year: 2024,
      type: "PREVISIONNEL",
      ETP: 3,
      coutJournalier: 15,
    });
  });

  it("should upsert structureTypologies by year", async () => {
    // GIVEN: one existing structure typology
    const structure = await createStructure();
    await prisma.structureTypologie.create({
      data: {
        structureId: structure.id,
        year: 2024,
        placesAutorisees: 10,
      },
    });

    // WHEN: same year receives new values
    await updateOne({
      id: structure.id,
      structureTypologies: [{ year: 2024, placesAutorisees: 25, pmr: 2 }],
    });

    // THEN: typology is updated
    const rows = await prisma.structureTypologie.findMany({
      where: { structureId: structure.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ year: 2024, placesAutorisees: 25, pmr: 2 });
  });

  it("should replace adresses list and typologies", async () => {
    // GIVEN: one existing address
    const structure = await createStructure();
    const oldAdresse = await prisma.adresse.create({
      data: {
        structureId: structure.id,
        adresse: "Ancienne adresse",
        codePostal: "13000",
        commune: "Marseille",
      },
    });

    // WHEN: update receives a new address list
    await updateOne({
      id: structure.id,
      adresses: [
        {
          adresse: "Nouvelle adresse",
          codePostal: "31000",
          commune: "Toulouse",
          repartition: Repartition.DIFFUS,
          adresseTypologies: [
            { year: 2026, placesAutorisees: 11, qpv: 2, logementSocial: 3 },
          ],
        },
      ],
    });

    // THEN: old address is removed and new one created with typology
    const adresses = await prisma.adresse.findMany({
      where: { structureId: structure.id },
      include: { adresseTypologies: true },
    });
    expect(adresses).toHaveLength(1);
    expect(adresses[0].id).not.toBe(oldAdresse.id);
    expect(adresses[0]).toMatchObject({
      adresse: "Nouvelle adresse",
      codePostal: "31000",
      commune: "Toulouse",
      repartition: "DIFFUS",
    });
    expect(adresses[0].adresseTypologies).toHaveLength(1);
    expect(adresses[0].adresseTypologies[0]).toMatchObject({
      year: 2026,
      placesAutorisees: 11,
      qpv: 2,
      logementSocial: 3,
    });
  });

  it("should replace antennes list", async () => {
    // GIVEN: one existing antenne
    const structure = await createStructure();
    await prisma.antenne.create({
      data: { structureId: structure.id, name: "old-antenne" },
    });

    // WHEN: one different antenne is sent
    await updateOne({
      id: structure.id,
      antennes: [{ name: "new-antenne", commune: "Lyon", departement: "69" }],
    });

    // THEN: only the new antenne remains
    const antennes = await prisma.antenne.findMany({
      where: { structureId: structure.id },
    });
    expect(antennes).toHaveLength(1);
    expect(antennes[0]).toMatchObject({
      name: "new-antenne",
      commune: "Lyon",
      departement: "69",
    });
  });

  it("should replace dnaStructures list", async () => {
    // GIVEN: one existing dna link
    const structure = await createStructure();
    const oldDna = await prisma.dna.create({
      data: { code: `DNA-OLD-${Date.now()}-${randomUUID()}` },
    });
    await prisma.dnaStructure.create({
      data: { structureId: structure.id, dnaId: oldDna.id },
    });

    // WHEN: a different dna code is provided
    const newCode = `DNA-NEW-${Date.now()}-${randomUUID()}`;
    await updateOne({
      id: structure.id,
      dnaStructures: [{ dna: { code: newCode, description: "New DNA" } }],
    });

    // THEN: only the new DNA link remains on structure
    const links = await prisma.dnaStructure.findMany({
      where: { structureId: structure.id },
      include: { dna: true },
    });
    expect(links).toHaveLength(1);
    expect(links[0].dna.code).toBe(newCode);
  });

  it("should replace finesses list", async () => {
    // GIVEN: one existing FINESS
    const structure = await createStructure();
    await prisma.finess.create({
      data: {
        structureId: structure.id,
        code: `FIN-OLD-${Date.now()}-${randomUUID()}`,
      },
    });

    // WHEN: a new FINESS list is sent
    const newCode = `FIN-NEW-${Date.now()}-${randomUUID()}`;
    await updateOne({
      id: structure.id,
      finesses: [{ code: newCode, description: "new finess" }],
    });

    // THEN: only the new FINESS remains
    const finesses = await prisma.finess.findMany({
      where: { structureId: structure.id },
    });
    expect(finesses).toHaveLength(1);
    expect(finesses[0]).toMatchObject({
      code: newCode,
      description: "new finess",
    });
  });

  it("should upsert actesAdministratifs and delete missing ones", async () => {
    // GIVEN: one existing acte with a file
    const structure = await createStructure();
    const oldFile = await createFileUpload("old-acte");
    await prisma.acteAdministratif.create({
      data: {
        structureId: structure.id,
        name: "Ancien acte",
        fileUploads: { connect: { key: oldFile.key } },
      },
    });
    const keptFile = await createFileUpload("new-acte");

    // WHEN: update contains only one acte bound to another file key
    await updateOne({
      id: structure.id,
      actesAdministratifs: [
        {
          name: "Nouveau acte",
          category: ActeAdministratifCategory[3],
          fileUploads: [{ key: keptFile.key }],
        },
      ],
    });

    // THEN: old acte is deleted and new one remains
    const actes = await prisma.acteAdministratif.findMany({
      where: { structureId: structure.id },
      include: { fileUploads: true },
    });
    expect(actes).toHaveLength(1);
    expect(actes[0].name).toBe("Nouveau acte");
    expect(actes[0].fileUploads.map((file) => file.key)).toContain(
      keptFile.key
    );
  });

  it("should upsert documentsFinanciers and delete missing ones", async () => {
    // GIVEN: one existing document financier with file
    const structure = await createStructure();
    const oldFile = await createFileUpload("old-doc");
    await prisma.documentFinancier.create({
      data: {
        structureId: structure.id,
        year: 2024,
        category: "AUTRE_FINANCIER",
        fileUploads: { connect: { key: oldFile.key } },
      },
    });
    const newFile = await createFileUpload("new-doc");

    // WHEN: update contains only the new file key
    await updateOne({
      id: structure.id,
      documentsFinanciers: [
        {
          year: 2025,
          name: "Document financier test",
          category: DocumentFinancierCategory[10],
          granularity: DocumentFinancierGranularity[0],
          fileUploads: [{ key: newFile.key }],
        },
      ],
    });

    // THEN: old document is deleted and new one is present
    const docs = await prisma.documentFinancier.findMany({
      where: { structureId: structure.id },
      include: { fileUploads: true },
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].year).toBe(2025);
    expect(docs[0].name).toBe("Document financier test");
    expect(docs[0].fileUploads.map((file) => file.key)).toContain(newFile.key);
  });

  it("should replace controles list", async () => {
    // GIVEN: one existing controle
    const structure = await createStructure();
    await prisma.controle.create({
      data: {
        structureId: structure.id,
        date: new Date("2024-01-01T00:00:00.000Z"),
        type: "INOPINE",
      },
    });
    const file = await createFileUpload("controle");

    // WHEN: sending a new controle list
    await updateOne({
      id: structure.id,
      controles: [
        {
          date: "2025-01-01T00:00:00.000Z",
          type: ControleType.PROGRAMME,
          fileUploads: [{ key: file.key, id: file.id }],
        },
      ],
    });

    // THEN: only the new controle remains
    const controles = await prisma.controle.findMany({
      where: { structureId: structure.id },
      include: { fileUploads: true },
    });
    expect(controles).toHaveLength(1);
    expect(controles[0].type).toBe("PROGRAMME");
    expect(
      controles[0].fileUploads.map((fileUpload) => fileUpload.key)
    ).toContain(file.key);
  });

  it("should replace evaluations list", async () => {
    // GIVEN: one existing evaluation
    const structure = await createStructure();
    await prisma.evaluation.create({
      data: {
        structureId: structure.id,
        date: new Date("2024-01-01T00:00:00.000Z"),
        note: 1,
      },
    });
    const file = await createFileUpload("evaluation");

    // WHEN: sending a new evaluations list
    await updateOne({
      id: structure.id,
      evaluations: [
        {
          date: "2025-02-01T00:00:00.000Z",
          note: 4,
          notePersonne: 3,
          notePro: 2,
          noteStructure: 5,
          fileUploads: [{ key: file.key }],
        },
      ],
    });

    // THEN: only the new evaluation remains
    const evaluations = await prisma.evaluation.findMany({
      where: { structureId: structure.id },
      include: { fileUploads: true },
    });
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toMatchObject({
      note: 4,
      notePersonne: 3,
      notePro: 2,
      noteStructure: 5,
    });
    expect(
      evaluations[0].fileUploads.map((fileUpload) => fileUpload.key)
    ).toContain(file.key);
  });

  it("should upsert forms and formSteps by definition/step slugs", async () => {
    // GIVEN: a structure and one existing form bound to a definition
    const structure = await createStructure();
    const formDefinition = await prisma.formDefinition.findFirstOrThrow({
      include: { stepsDefinition: true },
    });
    const firstStep = formDefinition.stepsDefinition[0];
    if (!firstStep) {
      throw new Error("No step definition found to test forms update");
    }

    // WHEN: form status and first step are updated by slug
    await updateOne({
      id: structure.id,
      forms: [
        {
          id: 0,
          status: true,
          formDefinition: {
            id: formDefinition.id,
            slug: formDefinition.slug,
            name: formDefinition.name,
            version: formDefinition.version,
          },
          formSteps: [
            {
              id: 0,
              status: StepStatus.FINALISE,
              stepDefinition: {
                id: firstStep.id,
                slug: firstStep.slug,
                label: firstStep.label,
              },
            },
          ],
        },
      ],
    });

    // THEN: the structure form and step are upserted
    const form = await prisma.form.findUniqueOrThrow({
      where: {
        structureId_formDefinitionId: {
          structureId: structure.id,
          formDefinitionId: formDefinition.id,
        },
      },
      include: { formSteps: true },
    });
    expect(form.status).toBe(true);
    expect(form.formSteps).toHaveLength(1);
    expect(form.formSteps[0].status).toBe("FINALISE");
  });

  it("should upsert structureMillesimes by year", async () => {
    // GIVEN: one existing millesime
    const structure = await createStructure();
    await prisma.structureMillesime.create({
      data: {
        structureId: structure.id,
        year: 2024,
        cpom: false,
      },
    });

    // WHEN: same year is updated
    await updateOne({
      id: structure.id,
      structureMillesimes: [
        {
          year: 2024,
          cpom: true,
          operateurComment: "Updated comment",
        },
      ],
    });

    // THEN: millesime is updated
    const rows = await prisma.structureMillesime.findMany({
      where: { structureId: structure.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      year: 2024,
      cpom: true,
      operateurComment: "Updated comment",
    });
  });
});
