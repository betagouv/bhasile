import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { updateOne } from "@/app/api/structures/structure.repository";
import prisma from "@/lib/prisma";
import { Repartition } from "@/types/adresse.type";
import { ControleType } from "@/types/controle.type";
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

  const updateStructureAndFetch = async <T>(
    structureId: number,
    payload: Record<string, unknown>,
    fetchData: () => Promise<T>
  ): Promise<T> => {
    await updateOne({
      id: structureId,
      ...payload,
    });
    return fetchData();
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
    const contacts = await updateStructureAndFetch(
      structure.id,
      {
        contacts: [newContact],
      },
      () =>
        prisma.contact.findMany({
          where: { structureId: structure.id },
          orderBy: { id: "asc" },
        })
    );

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(newContact);
  });

  it("should not modify contacts when updating only scalar fields", async () => {
    // GIVEN: a structure with existing contacts
    const structure = await createStructure();
    const existingContact = {
      prenom: "Contact",
      nom: "Stable",
      email: "contact.stable@example.test",
      telephone: "0100000999",
      role: "Coordination",
      perimetre: "Regional",
    };
    await prisma.contact.create({
      data: {
        structureId: structure.id,
        ...existingContact,
      },
    });

    const contacts = await updateStructureAndFetch(
      structure.id,
      {
        nom: "Nom mis à jour sans contacts",
      },
      () =>
        prisma.contact.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(existingContact);
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
    const newBudget = { year: 2024, commentaire: "new" };
    const budgets = await updateStructureAndFetch(
      structure.id,
      {
        budgets: [newBudget],
      },
      () =>
        prisma.budget.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject(newBudget);
  });

  it("should keep existing budgets and add a new one for another year", async () => {
    // GIVEN: existing budgets for multiple years
    const structure = await createStructure();
    const existingBudgets = [
      { year: 2021, commentaire: "budget-2021", dotationDemandee: 100000 },
      { year: 2022, commentaire: "budget-2022", dotationDemandee: 200000 },
      { year: 2023, commentaire: "budget-2023", dotationDemandee: 300000 },
      { year: 2024, commentaire: "budget-2024", dotationDemandee: 400000 },
    ];
    await prisma.budget.createMany({
      data: existingBudgets.map((budget) => ({
        structureId: structure.id,
        ...budget,
      })),
    });

    // WHEN: update contains a budget for another year
    const newBudget = {
      year: 2025,
      commentaire: "budget-2025",
      dotationDemandee: 500000,
    };
    const budgets = await updateStructureAndFetch(
      structure.id,
      {
        budgets: [newBudget],
      },
      () =>
        prisma.budget.findMany({
          where: { structureId: structure.id },
          orderBy: { year: "asc" },
        })
    );

    // THEN: existing years are kept and new year is added
    expect(budgets).toHaveLength(5);
    expect(budgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining(existingBudgets[0]),
        expect.objectContaining(existingBudgets[1]),
        expect.objectContaining(existingBudgets[2]),
        expect.objectContaining(existingBudgets[3]),
        expect.objectContaining(newBudget),
      ])
    );
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

    // WHEN: same year and type is updated
    const newIndicateurFinancier = {
      year: 2024,
      type: "PREVISIONNEL" as const,
      ETP: 3,
      coutJournalier: 15,
    };
    const rows = await updateStructureAndFetch(
      structure.id,
      {
        indicateursFinanciers: [newIndicateurFinancier],
      },
      () =>
        prisma.indicateurFinancier.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newIndicateurFinancier);
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
    const newStructureTypologie = { year: 2024, placesAutorisees: 25, pmr: 2 };
    const rows = await updateStructureAndFetch(
      structure.id,
      {
        structureTypologies: [newStructureTypologie],
      },
      () =>
        prisma.structureTypologie.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newStructureTypologie);
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
    const newAdresse = {
      adresse: "Nouvelle adresse",
      codePostal: "31000",
      commune: "Toulouse",
      repartition: Repartition.DIFFUS,
      adresseTypologies: [
        { year: 2026, placesAutorisees: 11, qpv: 2, logementSocial: 3 },
      ],
    };
    await updateOne({
      id: structure.id,
      adresses: [newAdresse],
    });

    // THEN: old address is removed and new one created with typology
    const adresses = await prisma.adresse.findMany({
      where: { structureId: structure.id },
      include: { adresseTypologies: true },
    });
    expect(adresses).toHaveLength(1);
    expect(adresses[0].id).not.toBe(oldAdresse.id);
    expect(adresses[0]).toMatchObject({
      adresse: newAdresse.adresse,
      codePostal: newAdresse.codePostal,
      commune: newAdresse.commune,
      repartition: "DIFFUS",
    });
    expect(adresses[0].adresseTypologies).toHaveLength(1);
    expect(adresses[0].adresseTypologies[0]).toMatchObject(
      newAdresse.adresseTypologies[0]
    );
  });

  it("should replace antennes list", async () => {
    // GIVEN: one existing antenne
    const structure = await createStructure();
    await prisma.antenne.create({
      data: { structureId: structure.id, name: "old-antenne" },
    });

    // WHEN: one different antenne is sent
    const newAntenne = {
      name: "new-antenne",
      commune: "Lyon",
      departement: "69",
    };
    const antennes = await updateStructureAndFetch(
      structure.id,
      {
        antennes: [newAntenne],
      },
      () =>
        prisma.antenne.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(antennes).toHaveLength(1);
    expect(antennes[0]).toMatchObject(newAntenne);
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
    const newFiness = { code: newCode, description: "new finess" };
    const finesses = await updateStructureAndFetch(
      structure.id,
      {
        finesses: [newFiness],
      },
      () =>
        prisma.finess.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(finesses).toHaveLength(1);
    expect(finesses[0]).toMatchObject(newFiness);
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
    const newActeAdministratif = {
      name: "Nouvel acte",
      category: "AUTRE" as const,
      fileUploads: [{ key: keptFile.key }],
    };
    const actes = await updateStructureAndFetch(
      structure.id,
      {
        actesAdministratifs: [newActeAdministratif],
      },
      () =>
        prisma.acteAdministratif.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
        })
    );

    expect(actes).toHaveLength(1);
    expect(actes[0].name).toBe(newActeAdministratif.name);
    expect(actes[0].category).toBe(newActeAdministratif.category);
    expect(actes[0].fileUploads).toHaveLength(1);
    expect(actes[0].fileUploads).toMatchObject([{ key: keptFile.key }]);
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

    // WHEN: update contains only the new file
    const newDocumentFinancier = {
      year: 2025,
      name: "Document financier test",
      category: "AUTRE_FINANCIER" as const,
      granularity: "STRUCTURE" as const,
      fileUploads: [{ key: newFile.key }],
    };
    const docs = await updateStructureAndFetch(
      structure.id,
      {
        documentsFinanciers: [newDocumentFinancier],
      },
      () =>
        prisma.documentFinancier.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
        })
    );

    expect(docs).toHaveLength(1);
    expect(docs[0].year).toBe(newDocumentFinancier.year);
    expect(docs[0].name).toBe(newDocumentFinancier.name);
    expect(docs[0].category).toBe(newDocumentFinancier.category);
    expect(docs[0].granularity).toBe(newDocumentFinancier.granularity);
    expect(docs[0].fileUploads).toHaveLength(1);
    expect(docs[0].fileUploads).toMatchObject([{ key: newFile.key }]);
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
    const newControle = {
      date: "2025-01-01T00:00:00.000Z",
      type: ControleType.PROGRAMME,
      fileUploads: [{ key: file.key, id: file.id }],
    };
    const controles = await updateStructureAndFetch(
      structure.id,
      {
        controles: [newControle],
      },
      () =>
        prisma.controle.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
        })
    );

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
    const newEvaluation = {
      date: "2025-02-01T00:00:00.000Z",
      note: 4,
      notePersonne: 3,
      notePro: 2,
      noteStructure: 5,
      fileUploads: [{ key: file.key }],
    };
    const evaluations = await updateStructureAndFetch(
      structure.id,
      {
        evaluations: [newEvaluation],
      },
      () =>
        prisma.evaluation.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
        })
    );

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toMatchObject({
      note: newEvaluation.note,
      notePersonne: newEvaluation.notePersonne,
      notePro: newEvaluation.notePro,
      noteStructure: newEvaluation.noteStructure,
    });
    expect(
      evaluations[0].fileUploads.map((fileUpload) => fileUpload.key)
    ).toContain(file.key);
  });

  it("should upsert forms and formSteps by definition/step slugs", async () => {
    // GIVEN: a structure and one existing form bound to a definition
    const structure = await createStructure();
    const formDefinition = await prisma.formDefinition.findFirstOrThrow({
      where: { slug: "finalisation-v1" },
      include: { stepsDefinition: true },
    });
    const firstStep = formDefinition.stepsDefinition[0];
    if (!firstStep) {
      throw new Error("No step definition found to test forms update");
    }

    // WHEN: form status and first step are updated by slug
    const newForm = {
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
    };
    await updateOne({
      id: structure.id,
      forms: [newForm],
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
    expect(form.status).toBe(newForm.status);
    expect(form.formDefinitionId).toBe(formDefinition.id);
    expect(form.formSteps).toHaveLength(1);
    expect(form.formSteps[0].stepDefinitionId).toBe(firstStep.id);
    expect(form.formSteps[0].status).toBe(newForm.formSteps[0].status);
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
    const newStructureMillesime = {
      year: 2024,
      cpom: true,
      operateurComment: "Updated comment",
    };
    const rows = await updateStructureAndFetch(
      structure.id,
      {
        structureMillesimes: [newStructureMillesime],
      },
      () =>
        prisma.structureMillesime.findMany({
          where: { structureId: structure.id },
        })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(newStructureMillesime);
  });
});
