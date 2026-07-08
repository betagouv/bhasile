import { describe, expect, it } from "vitest";

import type {
  StructureVersionDbDetails,
  StructureVersionDbTransformation,
} from "@/app/api/structure-versions/structure-version.db.type";
import {
  copyStructureVersion,
  dbStructureVersionToApiRead,
} from "@/app/api/structure-versions/structure-version.service";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import type { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { Repartition } from "@/types/adresse.type";
import { PublicType } from "@/types/structure.type";

const buildVersion = (
  overrides: Partial<StructureVersionDbDetails>
): StructureVersionDbDetails =>
  ({
    id: 1,
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    structureVersionTransformationId: null,
    structureVersionTransformation: null,
    ...overrides,
  }) as unknown as StructureVersionDbDetails;

const finalisedTransfo = (status: boolean) =>
  ({
    transformation: { form: { status } },
  }) as StructureVersionDbDetails["structureVersionTransformation"];

describe("resolveCurrentVersion", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");

  it("retient la version valide la plus récente (effectiveDate ≤ now)", () => {
    const older = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-02-01T00:00:00.000Z"),
    });
    const recent = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(resolveCurrentVersion([older, recent], now)?.id).toBe(2);
  });

  it("ignore les versions futures", () => {
    const past = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-05-01T00:00:00.000Z"),
    });
    const future = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-12-01T00:00:00.000Z"),
    });

    expect(resolveCurrentVersion([past, future], now)?.id).toBe(1);
  });

  it("retient une version effective aujourd'hui même si l'heure courante précède son horodatage", () => {
    const todayMorning = new Date("2026-06-15T08:00:00.000Z");
    const yesterday = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-06-14T12:00:00.000Z"),
    });
    const todayAtNoon = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-06-15T12:00:00.000Z"),
    });

    expect(
      resolveCurrentVersion([yesterday, todayAtNoon], todayMorning)?.id
    ).toBe(2);
  });

  it("ignore une version qui ne prend effet que demain", () => {
    const todayMorning = new Date("2026-06-15T08:00:00.000Z");
    const today = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-06-15T12:00:00.000Z"),
    });
    const tomorrow = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-06-16T12:00:00.000Z"),
    });

    expect(resolveCurrentVersion([today, tomorrow], todayMorning)?.id).toBe(1);
  });

  it("ignore une version de transfo dont le form n'est pas finalisé", () => {
    const rolling = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-02-01T00:00:00.000Z"),
    });
    const draftTransfo = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-05-01T00:00:00.000Z"),
      structureVersionTransformationId: 99,
      structureVersionTransformation: finalisedTransfo(false),
    });

    expect(resolveCurrentVersion([rolling, draftTransfo], now)?.id).toBe(1);
  });

  it("retient une version de transfo dont le form est finalisé", () => {
    const rolling = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-02-01T00:00:00.000Z"),
    });
    const validTransfo = buildVersion({
      id: 2,
      effectiveDate: new Date("2026-05-01T00:00:00.000Z"),
      structureVersionTransformationId: 99,
      structureVersionTransformation: finalisedTransfo(true),
    });

    expect(resolveCurrentVersion([rolling, validTransfo], now)?.id).toBe(2);
  });

  it("départage deux versions du même jour par id décroissant", () => {
    const sameDay = new Date("2026-05-01T00:00:00.000Z");
    const first = buildVersion({ id: 1, effectiveDate: sameDay });
    const second = buildVersion({ id: 2, effectiveDate: sameDay });

    expect(resolveCurrentVersion([first, second], now)?.id).toBe(2);
  });

  it("renvoie undefined quand aucune version n'est valide", () => {
    const future = buildVersion({
      id: 1,
      effectiveDate: new Date("2026-12-01T00:00:00.000Z"),
    });

    expect(resolveCurrentVersion([future], now)).toBeUndefined();
    expect(resolveCurrentVersion([], now)).toBeUndefined();
  });
});

const buildStructure = (): StructureDbDetails =>
  ({
    type: "CADA",
    public: "TOUT_PUBLIC",
    nom: "Structure source",
    adresseAdministrative: "1 rue de la Source",
    codePostalAdministratif: "50000",
    communeAdministrative: "Saint-Lô",
    departementAdministratif: "50",
    latitude: null,
    longitude: null,
    creationDate: null,
    date303: null,
    lgbt: false,
    fvvTeh: false,
    notes: null,
    nomOfii: null,
    directionTerritoriale: null,
    contacts: [
      {
        id: 7,
        structureId: 1,
        structureVersionId: null,
        prenom: "Nicolas",
        nom: "Leboeuf",
        telephone: "0652464214",
        email: "nicolas.leboeuf@lesmimosas.fr",
        role: "Responsable structure",
        perimetre: "Toutes les antennes",
      },
    ],
    antennes: [
      {
        id: 8,
        structureId: 1,
        structureVersionId: null,
        name: "Avranches Nord",
        adresse: "2 rue B",
        codePostal: "50300",
        commune: "Avranches",
        departement: "50",
      },
    ],
    adresses: [
      {
        id: 9,
        structureId: 1,
        structureVersionId: null,
        adresse: "3 rue C",
        codePostal: "50300",
        commune: "Avranches",
        repartition: "COLLECTIF",
        placesAutorisees: 10,
        qpv: 0,
        logementSocial: 0,
        adresseTypologies: [
          {
            id: 99,
            adresseId: 9,
            placesAutorisees: 10,
            year: 2024,
            qpv: 0,
            logementSocial: 0,
          },
        ],
      },
    ],
    structureFinesses: [
      {
        id: 10,
        structureId: 1,
        structureVersionId: null,
        finessId: 20,
        description: "FINESS toute la structure",
        finess: { id: 20, code: "FIN-1", description: null },
      },
    ],
    structureTypologies: [
      {
        id: 11,
        structureId: 1,
        structureVersionId: null,
        year: 2024,
        placesAutorisees: 10,
        pmr: 0,
        lgbt: 0,
        fvvTeh: 0,
      },
    ],
    dnaStructures: [
      {
        id: 12,
        structureId: 1,
        structureVersionId: null,
        dnaId: 50,
        description: "DNA site d'Avranches",
        startDate: null,
        endDate: null,
        dna: { id: 50, code: "DNA-1", description: null },
      },
    ],
  }) as unknown as StructureDbDetails;

describe("copyStructureVersion", () => {
  it("copie les scalaires et convertit les clés d'enum Prisma vers les valeurs d'enum de l'app", () => {
    const result = copyStructureVersion(buildStructure());

    expect(result.public).toBe(PublicType.TOUT_PUBLIC);
    expect(result.nom).toBe("Structure source");
    expect(result.adresseAdministrative).toBe("1 rue de la Source");
  });

  it("copie les relations sans leurs ids pour qu'elles soient recréées à neuf", () => {
    const result = copyStructureVersion(buildStructure());

    expect(result.contacts).toEqual([
      {
        prenom: "Nicolas",
        nom: "Leboeuf",
        telephone: "0652464214",
        email: "nicolas.leboeuf@lesmimosas.fr",
        role: "Responsable structure",
        perimetre: "Toutes les antennes",
      },
    ]);

    expect(result.antennes?.[0]).not.toHaveProperty("id");
    expect(result.antennes?.[0]).toMatchObject({
      name: "Avranches Nord",
      adresse: "2 rue B",
    });

    expect(result.adresses?.[0]).not.toHaveProperty("id");
    expect(result.adresses?.[0]?.adresseTypologies?.[0]).toEqual({
      placesAutorisees: 10,
      year: 2024,
      qpv: 0,
      logementSocial: 0,
    });

    expect(result.structureFinesses).toEqual([
      {
        description: "FINESS toute la structure",
        finess: { code: "FIN-1" },
      },
    ]);
    expect(result.structureTypologies?.[0]).toMatchObject({
      year: 2024,
      placesAutorisees: 10,
    });

    expect(result.dnaStructures?.[0]).not.toHaveProperty("id");
    expect(result.dnaStructures?.[0]?.description).toBe("DNA site d'Avranches");
    expect(result.dnaStructures?.[0]?.dna).toEqual({ code: "DNA-1" });
  });

  it("donne la priorité aux overrides sur les scalaires de la structure", () => {
    const result = copyStructureVersion(buildStructure(), {
      nom: "Nom override",
    });

    expect(result.nom).toBe("Nom override");
  });
});

const buildStructureVersion = (
  repartitions: Repartition[]
): StructureVersionDbTransformation =>
  ({
    type: "CADA",
    public: "TOUT_PUBLIC",
    nom: "Version source",
    adresseAdministrative: "1 rue de la Source",
    codePostalAdministratif: "50000",
    communeAdministrative: "Saint-Lô",
    departementAdministratif: "50",
    latitude: null,
    longitude: null,
    creationDate: null,
    date303: null,
    lgbt: false,
    fvvTeh: false,
    notes: null,
    nomOfii: null,
    directionTerritoriale: null,
    effectiveDate: null,
    antennes: [],
    structureFinesses: [],
    dnaStructures: [],
    structureTypologies: [],
    contacts: [],
    adresses: repartitions.map((repartition, index) => ({
      id: index + 1,
      structureId: 1,
      structureVersionId: null,
      adresse: "3 rue C",
      codePostal: "50300",
      commune: "Avranches",
      repartition,
      placesAutorisees: 10,
      qpv: 0,
      logementSocial: 0,
      adresseTypologies: [],
    })),
  }) as unknown as StructureVersionDbTransformation;

describe("dbStructureVersionToApiRead", () => {
  it("calcule adresseComplete sur les adresses de la version", () => {
    const result = dbStructureVersionToApiRead(
      buildStructureVersion([Repartition.COLLECTIF])
    );

    expect(result.adresses?.[0]?.adresseComplete).toBe(
      "3 rue C 50300 Avranches"
    );
  });

  it("infère typeBati COLLECTIF quand toutes les adresses sont collectives", () => {
    const result = dbStructureVersionToApiRead(
      buildStructureVersion([Repartition.COLLECTIF, Repartition.COLLECTIF])
    );

    expect(result.typeBati).toBe(Repartition.COLLECTIF);
  });

  it("infère typeBati DIFFUS quand toutes les adresses sont diffuses", () => {
    const result = dbStructureVersionToApiRead(
      buildStructureVersion([Repartition.DIFFUS])
    );

    expect(result.typeBati).toBe(Repartition.DIFFUS);
  });

  it("infère typeBati MIXTE quand les adresses mêlent diffus et collectif", () => {
    const result = dbStructureVersionToApiRead(
      buildStructureVersion([Repartition.DIFFUS, Repartition.COLLECTIF])
    );

    expect(result.typeBati).toBe(Repartition.MIXTE);
  });

  it("laisse typeBati undefined quand il n'y a aucune adresse", () => {
    const result = dbStructureVersionToApiRead(buildStructureVersion([]));

    expect(result.typeBati).toBeUndefined();
  });
});
