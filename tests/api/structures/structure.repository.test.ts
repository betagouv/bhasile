import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { updateOne } from "@/app/api/structures/structure.repository";
import {
  getFullStructure,
  getFullStructures,
  getStructureDepartement,
  getStructureForOperateur,
  type SearchProps,
} from "@/app/api/structures/structure.service";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import prisma from "@/lib/prisma";
import { Repartition } from "@/types/adresse.type";
import { ControleType } from "@/types/controle.type";
import { StepStatus } from "@/types/form.type";
import { PublicType, StructureType } from "@/types/structure.type";

describe("structure.repository db integration", () => {
  const createdStructureIds: number[] = [];
  const createdOperateurIds: number[] = [];

  const createStructure = async (type?: StructureType) => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DB-TEST-${Date.now()}-${Math.random()}`,
        type,
        structureVersions: {
          create: { effectiveDate: new Date("2020-01-01T12:00:00.000Z") },
        },
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

  const fetchCurrentVersion = (structureId: number) =>
    prisma.structureVersion.findFirstOrThrow({
      where: {
        structureId,
        structureVersionTransformationId: null,
      },
      orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
      include: {
        contacts: true,
        adresses: { include: { adresseTypologies: true } },
        antennes: true,
        structureFinesses: { include: { finess: true } },
        structureTypologies: true,
        dnaStructures: { include: { dna: true } },
      },
    });

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

  it("met à jour tous les champs scalaires de la structure en un seul appel", async () => {
    // GIVEN: an empty structure
    const structure = await createStructure();
    const creationDate = "2020-02-02T00:00:00.000Z";
    const date303 = "2021-03-03T00:00:00.000Z";

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
      creationDate,
      notes: "Notes de test",
      nomOfii: "Nom OFII",
      directionTerritoriale: "DT75",
    });

    // THEN: les scalaires versionnés sont sur le rolling, filiale reste sur Structure
    const version = await fetchCurrentVersion(structure.id);
    expect(version.public).toBe("FAMILLE");
    expect(version.adresseAdministrative).toBe("10 rue de la Paix");
    expect(version.codePostalAdministratif).toBe("75001");
    expect(version.communeAdministrative).toBe("Paris");
    expect(version.latitude?.toString()).toBe("48.8566");
    expect(version.longitude?.toString()).toBe("2.3522");
    expect(version.nom).toBe("Structure test complete");
    expect(version.notes).toBe("Notes de test");
    expect(version.nomOfii).toBe("Nom OFII");
    expect(version.directionTerritoriale).toBe("DT75");

    // creationDate / date303 sont immuables : ils vivent sur Structure, pas sur la version
    const updated = await prisma.structure.findUniqueOrThrow({
      where: { id: structure.id },
    });
    expect(updated.filiale).toBe("Filiale test");
    expect(updated.creationDate?.toISOString()).toBe(creationDate);
    expect(updated.date303?.toISOString()).toBe(date303);
  });

  it("met à jour la relation departementAdministratif", async () => {
    // GIVEN: a structure and an existing department
    const structure = await createStructure();
    const departement = await prisma.departement.findFirstOrThrow();

    // WHEN: department number is updated
    await updateOne({
      id: structure.id,
      departementAdministratif: departement.numero,
    });

    // THEN: le rolling référence le département attendu
    const version = await fetchCurrentVersion(structure.id);
    expect(version.departementAdministratif).toBe(departement.numero);
  });

  describe("invariant département administratif", () => {
    const createStructureWithDepartement = async (numero: string) => {
      const structure = await prisma.structure.create({
        data: {
          codeBhasile: `BHA-DB-TEST-${Date.now()}-${randomUUID()}`,
          departementAdministratif: numero,
          structureVersions: {
            create: {
              effectiveDate: new Date("2020-01-01T12:00:00.000Z"),
              departementAdministratif: numero,
            },
          },
        },
      });
      createdStructureIds.push(structure.id);
      return structure;
    };

    it("rejette avec une ApiDomainError le changement de département de la version courante", async () => {
      // GIVEN: a structure whose invariant departement is set (OFII-born)
      const premier = await prisma.departement.findFirstOrThrow();
      const second = await prisma.departement.findFirstOrThrow({
        where: { numero: { not: premier.numero } },
      });
      const structure = await createStructureWithDepartement(premier.numero);

      // WHEN/THEN: moving the current version to another departement is refused,
      // and the ApiDomainError propagates unwrapped so the route maps it to a 400.
      await expect(
        updateOne({ id: structure.id, departementAdministratif: second.numero })
      ).rejects.toThrow(ApiDomainError);
    });

    it("laisse changer d'adresse tant que le département reste identique", async () => {
      // GIVEN: a structure with its invariant departement set
      const departement = await prisma.departement.findFirstOrThrow();
      const structure = await createStructureWithDepartement(departement.numero);

      // WHEN: the admin address changes but the departement stays the same
      await updateOne({
        id: structure.id,
        departementAdministratif: departement.numero,
        communeAdministrative: "Nouvelle commune",
        adresseAdministrative: "2 rue Déménagée",
      });

      // THEN: the move is accepted
      const version = await fetchCurrentVersion(structure.id);
      expect(version.departementAdministratif).toBe(departement.numero);
      expect(version.communeAdministrative).toBe("Nouvelle commune");
    });

    it("laisse passer une mise à jour qui ne touche pas au département", async () => {
      // GIVEN: a structure with its invariant departement set
      const departement = await prisma.departement.findFirstOrThrow();
      const structure = await createStructureWithDepartement(departement.numero);

      // WHEN: an update carries no departement field
      await updateOne({ id: structure.id, nom: "Sans toucher au département" });

      // THEN: the scalar is updated, the departement untouched
      const version = await fetchCurrentVersion(structure.id);
      expect(version.nom).toBe("Sans toucher au département");
      expect(version.departementAdministratif).toBe(departement.numero);
    });
  });

  it("met à jour la relation operateur", async () => {
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

  it("remplace les contacts de la structure sur la version courante", async () => {
    // GIVEN: a structure whose rolling version already holds two contacts
    const structure = await createStructure();
    await updateOne({
      id: structure.id,
      contacts: [
        { prenom: "Alice", nom: "Legacy", email: "alice.legacy@example.test" },
        { prenom: "Bob", nom: "Legacy", email: "bob.legacy@example.test" },
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
    const version = await updateStructureAndFetch(
      structure.id,
      { contacts: [newContact] },
      () => fetchCurrentVersion(structure.id)
    );

    expect(version.contacts).toHaveLength(1);
    expect(version.contacts[0]).toMatchObject(newContact);
  });

  it("ne modifie pas les contacts de la version courante quand seuls des champs scalaires sont mis à jour", async () => {
    // GIVEN: a rolling version that already holds a contact
    const structure = await createStructure();
    const existingContact = {
      prenom: "Contact",
      nom: "Stable",
      email: "contact.stable@example.test",
      telephone: "0100000999",
      role: "Coordination",
      perimetre: "Regional",
    };
    await updateOne({ id: structure.id, contacts: [existingContact] });

    // WHEN: only a scalar field is updated (no contacts in the payload)
    const version = await updateStructureAndFetch(
      structure.id,
      { nom: "Nom mis à jour sans contacts" },
      () => fetchCurrentVersion(structure.id)
    );

    // THEN: the scalar is updated and the contacts are preserved
    expect(version.nom).toBe("Nom mis à jour sans contacts");
    expect(version.contacts).toHaveLength(1);
    expect(version.contacts[0]).toMatchObject(existingContact);
  });

  it("ne crée pas de nouvelle version quand le payload n'a aucun champ versionné", async () => {
    // GIVEN: a structure with only its initial version
    const structure = await createStructure();

    // WHEN: an update carries only non-versioned data (e.g. a budget)
    await updateOne({ id: structure.id, budgets: [{ year: 2024 }] });

    // THEN: no extra version is created — only the initial one remains
    const versionCount = await prisma.structureVersion.count({
      where: { structureId: structure.id },
    });
    expect(versionCount).toBe(1);
  });

  it("applique une correction sur place et préserve l'effectiveDate de la version courante", async () => {
    // GIVEN: a structure with its initial version (effectiveDate 2020-01-01)
    const structure = await createStructure();

    // WHEN: a correction updates a versioned scalar
    await updateOne({ id: structure.id, nom: "Nom corrigé" });

    // THEN: the scalar is updated on the same version, its effectiveDate untouched
    const version = await fetchCurrentVersion(structure.id);
    expect(version.nom).toBe("Nom corrigé");
    expect(version.effectiveDate?.toISOString()).toBe(
      "2020-01-01T12:00:00.000Z"
    );
    const versionCount = await prisma.structureVersion.count({
      where: { structureId: structure.id },
    });
    expect(versionCount).toBe(1);
  });

  it("lève une erreur en corrigeant une structure sans version courante (future uniquement)", async () => {
    // GIVEN: a structure whose only version is effective in the future
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DB-TEST-${Date.now()}-${Math.random()}`,
        structureVersions: {
          create: { effectiveDate: new Date("2099-01-01T12:00:00.000Z") },
        },
      },
    });
    createdStructureIds.push(structure.id);

    // WHEN/THEN: a versioned correction has no current version to land on → throws
    await expect(
      updateOne({ id: structure.id, nom: "Tentative de correction" })
    ).rejects.toThrow("Aucune version courante");
  });

  it("upsert les budgets de la structure par année", async () => {
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

  it("conserve les budgets existants et en ajoute un nouveau pour une autre année", async () => {
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

  it("upsert les indicateursFinanciers par année et par type", async () => {
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

  it("upsert les structureTypologies par année sur la version courante", async () => {
    // GIVEN: a rolling version with one typology for 2024
    const structure = await createStructure();
    await updateOne({
      id: structure.id,
      structureTypologies: [{ year: 2024, placesAutorisees: 10 }],
    });

    // WHEN: same year receives new values
    const newStructureTypologie = { year: 2024, placesAutorisees: 25, pmr: 2 };
    const version = await updateStructureAndFetch(
      structure.id,
      { structureTypologies: [newStructureTypologie] },
      () => fetchCurrentVersion(structure.id)
    );

    expect(version.structureTypologies).toHaveLength(1);
    expect(version.structureTypologies[0]).toMatchObject(newStructureTypologie);
  });

  it("remplace la liste des adresses et leurs typologies sur la version courante", async () => {
    // GIVEN: a rolling version with one address
    const structure = await createStructure();
    await updateOne({
      id: structure.id,
      adresses: [
        {
          adresse: "Ancienne adresse",
          codePostal: "13000",
          commune: "Marseille",
          repartition: Repartition.COLLECTIF,
        },
      ],
    });
    const initialVersion = await fetchCurrentVersion(structure.id);
    const oldAdresseId = initialVersion.adresses[0].id;

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
    const version = await fetchCurrentVersion(structure.id);
    expect(version.adresses).toHaveLength(1);
    expect(version.adresses[0].id).not.toBe(oldAdresseId);
    expect(version.adresses[0]).toMatchObject({
      adresse: newAdresse.adresse,
      codePostal: newAdresse.codePostal,
      commune: newAdresse.commune,
      repartition: "DIFFUS",
    });
    expect(version.adresses[0].adresseTypologies).toHaveLength(1);
    expect(version.adresses[0].adresseTypologies[0]).toMatchObject(
      newAdresse.adresseTypologies[0]
    );
  });

  it("remplace la liste des antennes sur la version courante", async () => {
    // GIVEN: a rolling version with one antenne
    const structure = await createStructure();
    await updateOne({
      id: structure.id,
      antennes: [{ name: "old-antenne" }],
    });

    // WHEN: one different antenne is sent
    const newAntenne = {
      name: "new-antenne",
      commune: "Lyon",
      departement: "69",
    };
    const version = await updateStructureAndFetch(
      structure.id,
      { antennes: [newAntenne] },
      () => fetchCurrentVersion(structure.id)
    );

    expect(version.antennes).toHaveLength(1);
    expect(version.antennes[0]).toMatchObject(newAntenne);
  });

  it("remplace la liste des dnaStructures sur la version courante", async () => {
    // GIVEN: a rolling version with one dna link
    const structure = await createStructure();
    const oldCode = `DNA-OLD-${Date.now()}-${randomUUID()}`;
    await updateOne({
      id: structure.id,
      dnaStructures: [{ dna: { code: oldCode } }],
    });

    // WHEN: a different dna code is provided
    const newCode = `DNA-NEW-${Date.now()}-${randomUUID()}`;
    await updateOne({
      id: structure.id,
      dnaStructures: [{ description: "New DNA", dna: { code: newCode } }],
    });

    // THEN: only the new DNA link remains on the rolling version
    const version = await fetchCurrentVersion(structure.id);
    expect(version.dnaStructures).toHaveLength(1);
    expect(version.dnaStructures[0].dna.code).toBe(newCode);
    expect(version.dnaStructures[0].description).toBe("New DNA");
  });

  it("fusionne les codes DNA en doublon en un seul lien au lieu de planter", async () => {
    // GIVEN: an empty structure
    const structure = await createStructure();
    const duplicatedCode = `DNA-DUP-${Date.now()}-${randomUUID()}`;

    // WHEN: the same DNA code is sent twice in one update (e.g. an autosaved draft)
    await updateOne({
      id: structure.id,
      dnaStructures: [
        { description: "Premier", dna: { code: duplicatedCode } },
        { description: "Doublon", dna: { code: duplicatedCode } },
      ],
    });

    // THEN: the save succeeds (no P2002) and a single link survives on the current version
    const version = await fetchCurrentVersion(structure.id);
    expect(version.dnaStructures).toHaveLength(1);
    expect(version.dnaStructures[0].dna.code).toBe(duplicatedCode);
  });

  it("getFullStructure résout la version courante dans le modèle de lecture", async () => {
    // GIVEN: a structure (type = invariant scalar) edited via the rolling write
    const structure = await createStructure(StructureType.CADA);
    await updateOne({
      id: structure.id,
      nom: "Nom versionné",
      adresses: [
        {
          adresse: "1 rue Versionnée",
          codePostal: "75001",
          commune: "Paris",
          repartition: Repartition.DIFFUS,
        },
      ],
    });

    // WHEN: the fiche is read end-to-end (findOne + résolution + merge)
    const read = await getFullStructure(structure.id);

    // THEN: the read model reflects the rolling version, not the frozen shell
    expect(read?.nom).toBe("Nom versionné");
    expect(read?.type).toBe(StructureType.CADA);
    expect(read?.adresses?.[0]?.commune).toBe("Paris");
  });

  it("remplace la liste des finesses sur la version courante", async () => {
    // GIVEN: a rolling version with one FINESS link
    const structure = await createStructure();
    await updateOne({
      id: structure.id,
      structureFinesses: [
        { finess: { code: `FIN-OLD-${Date.now()}-${randomUUID()}` } },
      ],
    });

    // WHEN: a new FINESS list is sent (description portée par le lien)
    const newCode = `FIN-NEW-${Date.now()}-${randomUUID()}`;
    const version = await updateStructureAndFetch(
      structure.id,
      {
        structureFinesses: [
          { description: "new finess", finess: { code: newCode } },
        ],
      },
      () => fetchCurrentVersion(structure.id)
    );

    expect(version.structureFinesses).toHaveLength(1);
    expect(version.structureFinesses[0].finess.code).toBe(newCode);
    expect(version.structureFinesses[0].description).toBe("new finess");
  });

  it("fusionne les codes FINESS en doublon en un seul lien au lieu de planter", async () => {
    // GIVEN: an empty structure
    const structure = await createStructure();
    const duplicatedCode = `FIN-DUP-${Date.now()}-${randomUUID()}`;

    // WHEN: the same FINESS code is sent twice in one update (e.g. an autosaved draft)
    await updateOne({
      id: structure.id,
      structureFinesses: [
        { description: "Premier", finess: { code: duplicatedCode } },
        { description: "Doublon", finess: { code: duplicatedCode } },
      ],
    });

    // THEN: the save succeeds (no P2002) and a single link survives on the current version
    const version = await fetchCurrentVersion(structure.id);
    expect(version.structureFinesses).toHaveLength(1);
    expect(version.structureFinesses[0].finess.code).toBe(duplicatedCode);
  });

  it("upsert les actesAdministratifs et supprime ceux qui manquent", async () => {
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

  it("conserve un avenant ajouté à un acte existant sans fichier", async () => {
    // GIVEN: a convention already in base WITHOUT any file
    const structure = await createStructure();
    const conventionWithoutFile = await prisma.acteAdministratif.create({
      data: {
        structureId: structure.id,
        category: "CONVENTION",
        name: "Convention sans fichier",
      },
    });
    const conventionFile = await createFileUpload("convention");
    const avenantFile = await createFileUpload("avenant");

    // WHEN: the convention gains a file and an avenant is added pointing at its
    // existing id (the form sends the convention id as the avenant parentId)
    const actes = await updateStructureAndFetch(
      structure.id,
      {
        actesAdministratifs: [
          {
            id: conventionWithoutFile.id,
            category: "CONVENTION" as const,
            fileUploads: [{ key: conventionFile.key }],
          },
          {
            category: "CONVENTION" as const,
            parentId: conventionWithoutFile.id,
            fileUploads: [{ key: avenantFile.key }],
          },
        ],
      },
      () =>
        prisma.acteAdministratif.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
          orderBy: { id: "asc" },
        })
    );

    // THEN: the convention keeps its id and the avenant is persisted under it
    expect(actes).toHaveLength(2);

    const convention = actes.find(
      (acte) => acte.id === conventionWithoutFile.id
    );
    expect(convention).toBeDefined();
    expect(convention?.parentId).toBeNull();
    expect(convention?.fileUploads.map((file) => file.key)).toEqual([
      conventionFile.key,
    ]);

    const avenant = actes.find((acte) => acte.id !== conventionWithoutFile.id);
    expect(avenant).toBeDefined();
    expect(avenant?.parentId).toBe(conventionWithoutFile.id);
    expect(avenant?.fileUploads.map((file) => file.key)).toEqual([
      avenantFile.key,
    ]);
  });

  it("ne met pas à jour un acte appartenant à une autre structure quand son id est envoyé", async () => {
    // GIVEN: an acte owned by another structure
    const otherStructure = await createStructure();
    const otherFile = await createFileUpload("other-acte");
    const foreignActe = await prisma.acteAdministratif.create({
      data: {
        structureId: otherStructure.id,
        category: "CONVENTION",
        name: "Acte d'une autre structure",
        fileUploads: { connect: { key: otherFile.key } },
      },
    });

    // WHEN: the saved structure sends a payload carrying the foreign acte id
    const structure = await createStructure();
    const newFile = await createFileUpload("hijack");
    const { foreignAfter, ownActes } = await updateStructureAndFetch(
      structure.id,
      {
        actesAdministratifs: [
          {
            id: foreignActe.id,
            category: "CONVENTION" as const,
            name: "Tentative de réassignation",
            fileUploads: [{ key: newFile.key }],
          },
        ],
      },
      async () => ({
        foreignAfter: await prisma.acteAdministratif.findUniqueOrThrow({
          where: { id: foreignActe.id },
          include: { fileUploads: true },
        }),
        ownActes: await prisma.acteAdministratif.findMany({
          where: { structureId: structure.id },
          include: { fileUploads: true },
        }),
      })
    );

    // THEN: the foreign acte is untouched (owner, fields and file preserved)
    expect(foreignAfter.structureId).toBe(otherStructure.id);
    expect(foreignAfter.name).toBe("Acte d'une autre structure");
    expect(foreignAfter.fileUploads.map((file) => file.key)).toEqual([
      otherFile.key,
    ]);

    // AND: the saving structure gets its own brand-new acte instead
    expect(ownActes).toHaveLength(1);
    expect(ownActes[0].id).not.toBe(foreignActe.id);
    expect(ownActes[0].fileUploads.map((file) => file.key)).toEqual([
      newFile.key,
    ]);
  });

  it("upsert les documentsFinanciers et supprime ceux qui manquent", async () => {
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

  it("remplace la liste des controles", async () => {
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

  it("remplace la liste des evaluations", async () => {
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

  it("upsert les forms et formSteps par slugs de définition/étape", async () => {
    // GIVEN: a structure and one existing form bound to a definition
    const structure = await createStructure();
    const formDefinition = await prisma.formDefinition.findFirstOrThrow({
      where: {
        stepsDefinition: {
          some: {},
        },
      },
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

  it("upsert les structureMillesimes par année", async () => {
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

  describe("résolution liste/carte", () => {
    const createdTransformationIds: number[] = [];
    const createdSvtIds: number[] = [];

    const baseSearch: SearchProps = {
      search: null,
      page: null,
      type: null,
      bati: null,
      placesAutorisees: null,
      departements: null,
      operateurs: null,
      column: null,
      direction: null,
      map: false,
      selection: true,
      finalised: false,
    };

    const listStructures = async (overrides: Partial<SearchProps>) => {
      const { structures } = await getFullStructures({
        ...baseSearch,
        ...overrides,
      });
      return structures;
    };

    const createTransfoVersion = async (
      structureId: number,
      {
        nom,
        effectiveDate,
        formStatus,
      }: {
        nom: string;
        effectiveDate: string;
        formStatus: boolean;
      }
    ) => {
      const formDefinition = await prisma.formDefinition.findFirstOrThrow();
      const transformation = await prisma.transformation.create({
        data: { type: "EXTENSION_EX_NIHILO" },
      });
      createdTransformationIds.push(transformation.id);
      const form = await prisma.form.create({
        data: {
          transformationId: transformation.id,
          formDefinitionId: formDefinition.id,
          status: formStatus,
        },
      });
      const svt = await prisma.structureVersionTransformation.create({
        data: {
          transformationId: transformation.id,
          type: "EXTENSION",
          structureType: StructureType.HUDA,
        },
      });
      createdSvtIds.push(svt.id);
      await prisma.structureVersion.create({
        data: {
          structureId,
          structureVersionTransformationId: svt.id,
          effectiveDate,
          nom,
        },
      });
      return { form };
    };

    afterAll(async () => {
      if (createdSvtIds.length > 0) {
        await prisma.structureVersionTransformation.deleteMany({
          where: { id: { in: createdSvtIds } },
        });
      }
      if (createdTransformationIds.length > 0) {
        await prisma.transformation.deleteMany({
          where: { id: { in: createdTransformationIds } },
        });
      }
    });

    it("la liste reflète les scalaires et relations de la version résolue", async () => {
      // GIVEN: a structure (type = invariant Structure scalar) edited via the rolling write
      const structure = await createStructure(StructureType.HUDA);
      const nom = `Liste-Nom-${randomUUID()}`;
      const dnaCode = `DNA-LST-${randomUUID()}`;
      await updateOne({
        id: structure.id,
        nom,
        adresses: [
          {
            adresse: "1 rue Résolue",
            codePostal: "75001",
            commune: "Paris",
            repartition: Repartition.DIFFUS,
            adresseTypologies: [
              { year: 2026, placesAutorisees: 42, qpv: 0, logementSocial: 0 },
            ],
          },
        ],
        structureTypologies: [{ year: 2026, placesAutorisees: 42 }],
        dnaStructures: [{ dna: { code: dnaCode } }],
      });

      // WHEN: the structure is read through the list path
      const structures = await listStructures({
        search: structure.codeBhasile,
      });
      const row = structures.find(
        (structureApiRead) =>
          structureApiRead.codeBhasile === structure.codeBhasile
      );

      // THEN: the list reflects the resolved version, not the frozen (null) shell
      expect(row).toBeDefined();
      expect(row?.type).toBe(StructureType.HUDA);
      expect(row?.nom).toBe(nom);
      expect(row?.typeBati).toBe(Repartition.DIFFUS);
      expect(row?.currentPlaces?.placesAutorisees).toBe(42);
      expect(
        row?.dnaStructures?.some(
          (dnaStructure) => dnaStructure.dna.code === dnaCode
        )
      ).toBe(true);
    });

    it("la recherche et le filtre type portent sur la version résolue", async () => {
      // GIVEN: a structure typed CADA (invariant) whose versioned nom lives on the rolling version
      const structure = await createStructure(StructureType.CADA);
      const nom = `Recherche-${randomUUID()}`;
      await updateOne({ id: structure.id, nom });

      // WHEN/THEN: searching by the resolved nom finds the structure
      const byNom = await listStructures({ search: nom });
      expect(
        byNom.some(
          (structureApiRead) =>
            structureApiRead.codeBhasile === structure.codeBhasile
        )
      ).toBe(true);

      // AND: filtering by the resolved type includes it
      const byType = await listStructures({
        search: structure.codeBhasile,
        type: StructureType.CADA,
      });
      expect(
        byType.some(
          (structureApiRead) =>
            structureApiRead.codeBhasile === structure.codeBhasile
        )
      ).toBe(true);

      // AND: filtering by another type excludes it
      const byOtherType = await listStructures({
        search: structure.codeBhasile,
        type: StructureType.HUDA,
      });
      expect(
        byOtherType.some(
          (structureApiRead) =>
            structureApiRead.codeBhasile === structure.codeBhasile
        )
      ).toBe(false);
    });

    it("fiche et liste résolvent la même version", async () => {
      // GIVEN: a structure typed HUDA (invariant) edited via the rolling write
      const structure = await createStructure(StructureType.HUDA);
      const nom = `Coherence-${randomUUID()}`;
      await updateOne({ id: structure.id, nom });

      // WHEN: read through both the fiche and the list
      const fiche = await getFullStructure(structure.id);
      const [listRow] = await listStructures({ search: structure.codeBhasile });

      // THEN: both resolve the version identically
      expect(fiche?.type).toBe(StructureType.HUDA);
      expect(listRow?.type).toBe(fiche?.type);
      expect(listRow?.nom).toBe(fiche?.nom);
    });

    it("gate transfo : brouillon ignoré, finalisé gagnant — fiche et liste d'accord", async () => {
      // GIVEN: a rolling version dated in the past (type is an invariant Structure scalar,
      // so version resolution is observed via nom, which does vary per version)
      const structure = await createStructure(StructureType.CADA);
      const rollingNom = `Rolling-${randomUUID()}`;
      const transfoNom = `Transfo-${randomUUID()}`;
      await updateOne({
        id: structure.id,
        nom: rollingNom,
      });
      const rolling = await fetchCurrentVersion(structure.id);
      await prisma.structureVersion.update({
        where: { id: rolling.id },
        data: { effectiveDate: new Date("2026-01-01T00:00:00.000Z") },
      });

      // AND: a more recent transfo version (different nom) whose form is not finalised
      const { form } = await createTransfoVersion(structure.id, {
        nom: transfoNom,
        effectiveDate: "2026-03-01T00:00:00.000Z",
        formStatus: false,
      });

      // WHEN: the transfo form is a draft -> it is ignored, the rolling wins
      const ficheDraft = await getFullStructure(structure.id);
      const [listDraft] = await listStructures({
        search: structure.codeBhasile,
      });
      expect(ficheDraft?.nom).toBe(rollingNom);
      expect(listDraft?.nom).toBe(rollingNom);

      // WHEN: the transfo form is finalised -> the more recent transfo version wins
      await prisma.form.update({
        where: { id: form.id },
        data: { status: true },
      });
      const ficheFinal = await getFullStructure(structure.id);
      const [listFinal] = await listStructures({
        search: structure.codeBhasile,
      });
      expect(ficheFinal?.nom).toBe(transfoNom);
      expect(listFinal?.nom).toBe(transfoNom);
    });
  });

  describe("contrat finalisation et visibilité", () => {
    const createdTransformationIds: number[] = [];
    const createdSvtIds: number[] = [];

    // selection: false -> exerce le filtre de visibilité (EXISTS Form OR bornFromCreation)
    const baseSearch: SearchProps = {
      search: null,
      page: null,
      type: null,
      bati: null,
      placesAutorisees: null,
      departements: null,
      operateurs: null,
      column: null,
      direction: null,
      map: false,
      selection: false,
      finalised: false,
    };

    const listBy = async (
      codeBhasile: string,
      overrides: Partial<SearchProps> = {}
    ) => {
      const { structures } = await getFullStructures({
        ...baseSearch,
        search: codeBhasile,
        ...overrides,
      });
      return structures;
    };

    const findRow = (
      structures: Awaited<ReturnType<typeof listBy>>,
      codeBhasile: string
    ) => structures.find((structure) => structure.codeBhasile === codeBhasile);

    // Coquille sans version (comme une structure née d'une transfo, avant versions)
    const createShellStructure = async () => {
      const structure = await prisma.structure.create({
        data: { codeBhasile: `BHA-DB-TEST-${Date.now()}-${randomUUID()}` },
      });
      createdStructureIds.push(structure.id);
      return structure;
    };

    const addTransfoVersion = async (
      structureId: number,
      {
        svtType,
        effectiveDate,
      }: {
        svtType: "CREATION" | "EXTENSION";
        effectiveDate: string;
      }
    ) => {
      const formDefinition = await prisma.formDefinition.findFirstOrThrow();
      const transformation = await prisma.transformation.create({
        data: { type: "OUVERTURE_EX_NIHILO" },
      });
      createdTransformationIds.push(transformation.id);
      // Form de la transfo à true : sinon la version n'est pas "courante" (currentVersionWhere)
      await prisma.form.create({
        data: {
          transformationId: transformation.id,
          formDefinitionId: formDefinition.id,
          status: true,
        },
      });
      const svt = await prisma.structureVersionTransformation.create({
        data: {
          transformationId: transformation.id,
          type: svtType,
          structureType: StructureType.CADA,
        },
      });
      createdSvtIds.push(svt.id);
      await prisma.structureVersion.create({
        data: {
          structureId,
          structureVersionTransformationId: svt.id,
          effectiveDate,
          nom: `V-${randomUUID()}`,
        },
      });
    };

    // Née d'une transfo CREATION : coquille + version liée à une SVT CREATION, aucun form finalisation
    const createCreationBornStructure = async () => {
      const structure = await createShellStructure();
      await addTransfoVersion(structure.id, {
        svtType: "CREATION",
        effectiveDate: "2020-01-01T12:00:00.000Z",
      });
      return structure;
    };

    // Normale : version classique (transfo null) + form finalisation-v1 au statut voulu
    const createStructureWithFinalisationForm = async (status: boolean) => {
      const structure = await createStructure();
      const formDefinition = await prisma.formDefinition.findUniqueOrThrow({
        where: { slug: "finalisation-v1" },
      });
      await prisma.form.create({
        data: {
          structureId: structure.id,
          formDefinitionId: formDefinition.id,
          status,
        },
      });
      return structure;
    };

    afterAll(async () => {
      if (createdSvtIds.length > 0) {
        await prisma.structureVersionTransformation.deleteMany({
          where: { id: { in: createdSvtIds } },
        });
      }
      if (createdTransformationIds.length > 0) {
        await prisma.transformation.deleteMany({
          where: { id: { in: createdTransformationIds } },
        });
      }
    });

    it("une structure née d'une transfo CREATION apparaît dans la liste et est finalisée", async () => {
      // GIVEN: a structure born from a CREATION block (no finalisation form)
      const structure = await createCreationBornStructure();

      // WHEN: read through the (paginated) list path
      const row = findRow(
        await listBy(structure.codeBhasile),
        structure.codeBhasile
      );

      // THEN: it is visible despite having no finalisation form, and counts as finalised
      expect(row).toBeDefined();
      expect(row?.isFinalised).toBe(true);

      // AND: the detail read (TS .some() realization) agrees with the SQL one
      const fiche = await getFullStructure(structure.id);
      expect(fiche?.isFinalised).toBe(true);
    });

    it("une coquille sans form ni transfo (référentiel) reste cachée de la liste", async () => {
      // GIVEN: a bare structure with a current version but no form and no transfo
      const structure = await createStructure();

      // WHEN/THEN: the visibility filter excludes it
      const row = findRow(
        await listBy(structure.codeBhasile),
        structure.codeBhasile
      );
      expect(row).toBeUndefined();
    });

    it("une normale finalisée est visible et finalisée ; non finalisée est visible mais non finalisée", async () => {
      // GIVEN: one finalised and one in-progress structure
      const finalised = await createStructureWithFinalisationForm(true);
      const inProgress = await createStructureWithFinalisationForm(false);

      // THEN: both appear in the managed list (selection: false)
      const finalisedRow = findRow(
        await listBy(finalised.codeBhasile),
        finalised.codeBhasile
      );
      const inProgressRow = findRow(
        await listBy(inProgress.codeBhasile),
        inProgress.codeBhasile
      );
      expect(finalisedRow?.isFinalised).toBe(true);
      expect(inProgressRow?.isFinalised).toBe(false);
    });

    it("CREATION puis EXTENSION : finalisée via l'historique, pas via la version courante", async () => {
      // GIVEN: a CREATION-born structure later extended (current version = EXTENSION)
      const structure = await createCreationBornStructure();
      await addTransfoVersion(structure.id, {
        svtType: "EXTENSION",
        effectiveDate: "2021-06-01T12:00:00.000Z",
      });

      // THEN: still finalised (the CREATION lives in history, not in the current version)
      const row = findRow(
        await listBy(structure.codeBhasile),
        structure.codeBhasile
      );
      expect(row).toBeDefined();
      expect(row?.isFinalised).toBe(true);

      // AND: the detail .some() realization also scans history, not just the current EXTENSION
      const fiche = await getFullStructure(structure.id);
      expect(fiche?.isFinalised).toBe(true);
    });

    it("une CREATION future-datée n'est pas encore finalisée (détail et liste cohérents)", async () => {
      // GIVEN: a structure whose only version is a CREATION effective in the future
      const structure = await createShellStructure();
      await addTransfoVersion(structure.id, {
        svtType: "CREATION",
        effectiveDate: "2099-01-01T12:00:00.000Z",
      });

      // THEN: hidden from the list (no current version yet)
      const row = findRow(
        await listBy(structure.codeBhasile),
        structure.codeBhasile
      );
      expect(row).toBeUndefined();

      // AND: detail agrees — born-from-creation only counts once the CREATION is effective,
      // so isFinalised is false instead of the loose .some() returning true.
      const fiche = await getFullStructure(structure.id);
      expect(fiche?.isFinalised).toBe(false);
    });

    it("le filtre finalised=true inclut une structure née d'une CREATION et exclut une non finalisée", async () => {
      // GIVEN: a CREATION-born structure and an in-progress normal one
      const creationBorn = await createCreationBornStructure();
      const inProgress = await createStructureWithFinalisationForm(false);

      // THEN: the finalised filter keeps the CREATION-born, drops the in-progress
      expect(
        findRow(
          await listBy(creationBorn.codeBhasile, { finalised: true }),
          creationBorn.codeBhasile
        )
      ).toBeDefined();
      expect(
        findRow(
          await listBy(inProgress.codeBhasile, { finalised: true }),
          inProgress.codeBhasile
        )
      ).toBeUndefined();
    });
  });

  describe("résolution lectures scalaires", () => {
    const createdTransformationIds: number[] = [];
    const createdSvtIds: number[] = [];
    const createdCpomIds: number[] = [];

    const createTransfoVersion = async (
      structureId: number,
      {
        effectiveDate,
        formStatus,
        type,
        ...scalars
      }: {
        effectiveDate: string;
        formStatus: boolean;
        type?: StructureType;
        nom?: string;
        departementAdministratif?: string;
        communeAdministrative?: string;
      }
    ) => {
      const formDefinition = await prisma.formDefinition.findFirstOrThrow();
      const transformation = await prisma.transformation.create({
        data: { type: "EXTENSION_EX_NIHILO" },
      });
      createdTransformationIds.push(transformation.id);
      const form = await prisma.form.create({
        data: {
          transformationId: transformation.id,
          formDefinitionId: formDefinition.id,
          status: formStatus,
        },
      });
      const svt = await prisma.structureVersionTransformation.create({
        data: {
          transformationId: transformation.id,
          type: "EXTENSION",
          structureType: type,
        },
      });
      createdSvtIds.push(svt.id);
      await prisma.structureVersion.create({
        data: {
          structureId,
          structureVersionTransformationId: svt.id,
          effectiveDate,
          ...scalars,
        },
      });
      return { form };
    };

    afterAll(async () => {
      if (createdSvtIds.length > 0) {
        await prisma.structureVersionTransformation.deleteMany({
          where: { id: { in: createdSvtIds } },
        });
      }
      if (createdTransformationIds.length > 0) {
        await prisma.transformation.deleteMany({
          where: { id: { in: createdTransformationIds } },
        });
      }
      if (createdCpomIds.length > 0) {
        await prisma.cpom.deleteMany({
          where: { id: { in: createdCpomIds } },
        });
      }
    });

    it("getStructureDepartement résout le département de la version courante", async () => {
      // GIVEN: a structure whose departement lives only on its current version
      const structure = await createStructure();
      const departement = await prisma.departement.findFirstOrThrow();
      await updateOne({
        id: structure.id,
        departementAdministratif: departement.numero,
      });

      // WHEN: the PUT gate resolves the structure departement
      const resolved = await getStructureDepartement(structure.id);

      // THEN: it reflects the version, not the frozen (null) scalar on Structure
      expect(resolved).toBe(departement.numero);
    });

    it("getStructureDepartement suit une transfo finalisée et ignore un brouillon", async () => {
      // GIVEN: a current version (effective 2020) in an initial departement
      const structure = await createStructure();
      const firstDepartement = await prisma.departement.findFirstOrThrow();
      const secondDepartement = await prisma.departement.findFirstOrThrow({
        where: { numero: { not: firstDepartement.numero } },
      });
      await updateOne({
        id: structure.id,
        departementAdministratif: firstDepartement.numero,
      });

      // AND: a more recent (but still past) transfo version in another
      // departement, not finalised
      const { form } = await createTransfoVersion(structure.id, {
        effectiveDate: "2021-01-01T00:00:00.000Z",
        formStatus: false,
        departementAdministratif: secondDepartement.numero,
      });

      // WHEN: the transfo is a draft -> the gate keeps the initial departement
      expect(await getStructureDepartement(structure.id)).toBe(
        firstDepartement.numero
      );

      // WHEN: the transfo is finalised -> the gate follows the new departement
      await prisma.form.update({
        where: { id: form.id },
        data: { status: true },
      });
      expect(await getStructureDepartement(structure.id)).toBe(
        secondDepartement.numero
      );
    });

    it("getStructureForOperateur résout le type de la version courante", async () => {
      // GIVEN: a structure typed CADA (invariant Structure scalar)
      const structure = await createStructure(StructureType.CADA);

      // WHEN: the operateur read resolves the structure
      const result = await getStructureForOperateur(structure.id);

      // THEN: type comes from the Structure scalar, identity fields stay intact
      expect(result.type).toBe(StructureType.CADA);
      expect(result.id).toBe(structure.id);
      expect(result.codeBhasile).toBe(structure.codeBhasile);
    });

    it("getFullStructure résout type/commune des structures liées d'un CPOM via leur version courante", async () => {
      // GIVEN: a host and a partner sharing a CPOM, the partner's type/commune
      // living only on its current version
      const hostStructure = await createStructure();
      const partnerStructure = await createStructure(StructureType.CADA);
      await updateOne({
        id: partnerStructure.id,
        communeAdministrative: "Lyon",
      });
      const operateur = await prisma.operateur.create({
        data: { name: `Operateur-cpom-${randomUUID()}` },
      });
      createdOperateurIds.push(operateur.id);
      const cpom = await prisma.cpom.create({
        data: {
          operateurId: operateur.id,
          structures: {
            create: [
              { structureId: hostStructure.id },
              { structureId: partnerStructure.id },
            ],
          },
        },
      });
      createdCpomIds.push(cpom.id);

      // WHEN: the host fiche is read
      const fiche = await getFullStructure(hostStructure.id);

      // THEN: the linked partner reflects its version, not the frozen scalar
      const linkedPartner = fiche?.cpomStructures
        ?.flatMap((cpomStructure) => cpomStructure.cpom?.structures ?? [])
        .find((linked) => linked.structure?.id === partnerStructure.id);
      expect(linkedPartner?.structure?.type).toBe(StructureType.CADA);
      expect(linkedPartner?.structure?.communeAdministrative).toBe("Lyon");
    });
  });
});
