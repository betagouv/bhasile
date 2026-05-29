import { describe, expect, it } from "vitest";

import { copyStructureVersion } from "@/app/api/structure-versions/structure-version.service";
import type { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { PublicType, StructureType } from "@/types/structure.type";

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
    finesses: [
      {
        id: 10,
        structureId: 1,
        structureVersionId: null,
        code: "FIN-1",
        description: null,
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
        placesACreer: null,
        placesAFermer: null,
        echeancePlacesACreer: null,
        echeancePlacesAFermer: null,
      },
    ],
    dnaStructures: [
      {
        id: 12,
        structureId: 1,
        structureVersionId: null,
        dnaId: 50,
        startDate: null,
        endDate: null,
        dna: { id: 50, code: "DNA-1", description: null },
      },
    ],
  }) as unknown as StructureDbDetails;

describe("copyStructureVersion", () => {
  it("copies scalars and converts Prisma enum keys to the app enum values", () => {
    const result = copyStructureVersion(buildStructure());

    expect(result.type).toBe(StructureType.CADA);
    expect(result.public).toBe(PublicType.TOUT_PUBLIC);
    expect(result.nom).toBe("Structure source");
    expect(result.adresseAdministrative).toBe("1 rue de la Source");
  });

  it("copies relations without their ids so they are recreated fresh", () => {
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

    // Les finesses ne sont pas recopiées : le code FINESS est unique en base.
    expect(result.finesses).toBeUndefined();
    expect(result.structureTypologies?.[0]).toMatchObject({
      year: 2024,
      placesAutorisees: 10,
    });

    // dnaStructures : table de passage recopiée, en réutilisant le Dna via son code.
    expect(result.dnaStructures?.[0]).not.toHaveProperty("id");
    expect(result.dnaStructures?.[0]?.dna).toEqual({
      code: "DNA-1",
      description: undefined,
    });
  });

  it("lets overrides win over the structure scalars", () => {
    const result = copyStructureVersion(buildStructure(), {
      type: StructureType.HUDA,
    });

    expect(result.type).toBe(StructureType.HUDA);
  });
});
