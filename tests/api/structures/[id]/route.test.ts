import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/structures/[id]/route";

const mockGetServerSession = vi.fn();
const mockCanUpdateStructure = vi.fn();
const mockCanUpdateDepartement = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneOperateur = vi.fn();
const mockFindStructureDepartement = vi.fn();
const mockUpdateOne = vi.fn();
const mockCreateStructureEvent = vi.fn();
const mockGetAdresseAdministrativeCoordinates = vi.fn();
const mockGetAdressesApiRead = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/casl/abilities", () => ({
  canUpdateStructure: (...args: unknown[]) => mockCanUpdateStructure(...args),
  canUpdateDepartement: (...args: unknown[]) =>
    mockCanUpdateDepartement(...args),
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  findOneOperateur: (...args: unknown[]) => mockFindOneOperateur(...args),
  findStructureDepartement: (...args: unknown[]) =>
    mockFindStructureDepartement(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/activites/activite.util", () => ({
  processActivitesForStructure: vi.fn().mockReturnValue([]),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
  getAdresseAdministrativeCoordinates: (...args: unknown[]) =>
    mockGetAdresseAdministrativeCoordinates(...args),
  buildStructureHistory: vi.fn().mockReturnValue([]),
  buildUpcomingTransformations: vi.fn().mockReturnValue([]),
  getCpomStructuresWithDates: vi.fn().mockReturnValue([]),
  getCurrentPlacesAutorisees: vi.fn().mockReturnValue(10),
  getCurrentPlacesLogementsSociaux: vi.fn().mockReturnValue(2),
  getCurrentPlacesQpv: vi.fn().mockReturnValue(3),
  getOperateurLabel: vi.fn().mockReturnValue("Adoma"),
  getTypeBati: vi.fn().mockReturnValue("DIFFUS"),
  isStructureInCpom: vi.fn().mockReturnValue(false),
  isStructureInCpomPerYear: vi.fn().mockReturnValue({}),
  getDatesConvention: vi.fn().mockReturnValue([null, null]),
  getDatesPeriodeAutorisation: vi.fn().mockReturnValue([null, null]),
  isBornFromCreation: vi.fn().mockReturnValue(false),
  isFinalisationFormValidated: vi.fn().mockReturnValue(false),
}));

vi.mock("@/app/api/antennes/antenne.util", () => ({
  getAntennesApiRead: vi.fn().mockReturnValue(undefined),
}));

vi.mock("@/app/api/dna-structures/dna-structure.util", () => ({
  getDnaStructuresApiRead: vi.fn().mockReturnValue([]),
}));

vi.mock("@/app/api/finesses/finess.util", () => ({
  getStructureFinessesApiRead: vi.fn().mockReturnValue(undefined),
}));

vi.mock("@/app/api/adresses/adresse.util", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/app/api/adresses/adresse.util")
  >()),
  getAdressesApiRead: (...args: unknown[]) => mockGetAdressesApiRead(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createStructureEvent: (...args: unknown[]) =>
    mockCreateStructureEvent(...args),
}));

describe("GET /api/structures/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdressesApiRead.mockReturnValue([]);
  });

  it("retourne la structure complète quand l'utilisateur est authentifié avec des droits d'édition", async () => {
    // GIVEN
    const dbStructure = {
      id: 1,
      name: "Test",
      filiale: null,
      operateur: { id: 1, name: "Adoma" },
      type: "CADA",
      adresses: [],
      cpomStructures: [],
      creationDate: new Date("2020-01-01"),
      date303: null,
      dnaStructures: [],
      latitude: 48.86,
      longitude: 2.34,
      structureVersions: [],
    };
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(dbStructure);
    mockCanUpdateStructure.mockReturnValueOnce(true);
    mockGetAdressesApiRead.mockReturnValueOnce([{ id: 1 }]);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 1,
      name: "Test",
      nom: "",
      filiale: undefined,
      operateur: { id: 1, name: "Adoma" },
      type: "CADA",
      adresses: [{ id: 1 }],
      adresseAdministrative: "",
      codePostalAdministratif: "",
      communeAdministrative: "",
      departementAdministratif: "",
      adresseAdministrativeComplete: "",
      contacts: [],
      documentsFinanciers: [],
      cpomStructures: [],
      history: [],
      upcomingTransformations: [],
      creationDate: "2020-01-01T00:00:00.000Z",
      date303: undefined,
      debutConvention: null,
      finConvention: null,
      debutPeriodeAutorisation: null,
      finPeriodeAutorisation: null,
      dnaStructures: [],
      latitude: "48.86",
      longitude: "2.34",
      activites: [],
      evenementsIndesirablesGraves: [],
      operateurLabel: "Adoma",
      isAutorisee: true,
      isSubventionnee: false,
      isMultiAntenne: false,
      isMultiDna: false,
      typeBati: "DIFFUS",
      lgbt: false,
      fvvTeh: false,
      antennes: undefined,
      structureFinesses: undefined,
      structureTypologies: [],
      public: undefined,
      currentPlaces: {
        placesAutorisees: 10,
        qpv: 3,
        logementsSociaux: 2,
      },
      isInCpom: false,
      isInCpomPerYear: {},
      isFinalised: false,
      isCurrentVersionFromTransformation: false,
    });
    expect(mockFindOne).toHaveBeenCalledWith(1);
    expect(mockFindOneOperateur).not.toHaveBeenCalled();
  });

  it("déduit les vulnérabilités lgbt/fvvTeh des places du dernier millésime", async () => {
    // GIVEN : le millésime le plus récent (2024) a des places LGBT mais pas FVV/TEH,
    // un millésime antérieur (2023) avait des places FVV/TEH -> ne doit pas fuiter.
    // Les typologies sont dé-versionnées : elles vivent sur la Structure.
    const currentVersion = {
      id: 20,
      effectiveDate: new Date("2021-01-01"),
      structureVersionTransformationId: null,
      structureVersionTransformation: null,
      dnaStructures: [],
    };
    const dbStructure = {
      id: 2,
      name: "Test",
      filiale: null,
      operateur: { id: 1, name: "Adoma" },
      cpomStructures: [],
      creationDate: new Date("2020-01-01"),
      date303: null,
      latitude: 48.86,
      longitude: 2.34,
      structureTypologies: [
        { year: 2024, lgbt: 5, fvvTeh: 0 },
        { year: 2023, lgbt: 0, fvvTeh: 9 },
      ],
      structureVersions: [currentVersion],
    };
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(dbStructure);
    mockCanUpdateStructure.mockReturnValueOnce(true);

    const request = new NextRequest("http://localhost/api/structures/2");

    // WHEN
    const response = await GET(request);

    // THEN
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.lgbt).toBe(true);
    expect(body.fvvTeh).toBe(false);
  });

  it("masque l'adresse exacte mais conserve la commune quand l'utilisateur authentifié n'a pas les droits d'édition", async () => {
    // GIVEN
    const dbStructure = {
      id: 1,
      type: "CADA",
      adresses: [{ id: 42 }],
      cpomStructures: [],
      creationDate: new Date("2020-01-01"),
      dnaStructures: [],
      structureVersions: [],
    };
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(dbStructure);
    mockCanUpdateStructure.mockReturnValueOnce(false);
    mockGetAdressesApiRead.mockReturnValueOnce([
      {
        id: 42,
        adresse: "12 rue secrète",
        codePostal: "75001",
        commune: "Paris",
        adresseComplete: "12 rue secrète 75001 Paris",
      },
    ]);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect((await response.json()).adresses).toEqual([
      {
        id: 42,
        adresse: "",
        codePostal: "75001",
        commune: "Paris",
        adresseComplete: "75001 Paris",
      },
    ]);
  });

  it("retourne une structure limitée quand l'utilisateur n'est pas authentifié", async () => {
    // GIVEN
    const structure = { id: 1 };
    mockGetServerSession.mockResolvedValueOnce(null);
    mockFindOneOperateur.mockResolvedValueOnce(structure);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(structure);
    expect(mockFindOneOperateur).toHaveBeenCalledWith(1);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("retourne 404 quand la structure est introuvable", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/structures/999");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
    expect(mockCreateStructureEvent).not.toHaveBeenCalled();
  });

  it("retourne 500 quand le service lève une erreur", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockRejectedValueOnce(new Error("Database error"));

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });
});

describe("PUT /api/structures/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/structures/1", {
      method: "PUT",
      body: JSON.stringify({ id: 1 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Non authentifié" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("retourne 403 quand l'utilisateur a des droits insuffisants", async () => {
    // GIVEN
    const session = { user: { id: 1 } };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindStructureDepartement.mockResolvedValueOnce({
      departementAdministratif: "75",
    });
    mockCanUpdateDepartement.mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/structures/2", {
      method: "PUT",
      body: JSON.stringify({ id: 2 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "2" }),
    });

    // THEN
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Droits insuffisants" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("retourne 200 et appelle le repository avec le payload enrichi", async () => {
    // GIVEN
    const session = { user: { id: 1 } };
    const coordinates = { latitude: 48.86, longitude: 2.34 };
    const updatedStructure = { id: 3 };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindStructureDepartement.mockResolvedValueOnce({
      departementAdministratif: "75",
    });
    mockCanUpdateDepartement.mockReturnValueOnce(true);
    mockGetAdresseAdministrativeCoordinates.mockResolvedValueOnce(coordinates);
    mockUpdateOne.mockResolvedValueOnce(updatedStructure);

    const request = new Request("http://localhost/api/structures/3", {
      method: "PUT",
      body: JSON.stringify({ id: 3 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "3" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toBe("Structure mise à jour avec succès");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, ...coordinates }),
      false
    );
  });

  it("convertit les booléens qpv/logementSocial de l'adresse en nombres via le transform du schéma", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindStructureDepartement.mockResolvedValueOnce({
      departementAdministratif: "75",
    });
    mockCanUpdateDepartement.mockReturnValueOnce(true);
    mockGetAdresseAdministrativeCoordinates.mockResolvedValueOnce({});
    mockUpdateOne.mockResolvedValueOnce({ id: 4 });

    const request = new Request("http://localhost/api/structures/4", {
      method: "PUT",
      body: JSON.stringify({
        id: 4,
        adresses: [
          {
            adresse: "1 rue de Paris",
            codePostal: "75011",
            commune: "Paris",
            repartition: "DIFFUS",
            adresseTypologies: [
              {
                year: 2024,
                placesAutorisees: 10,
                qpv: true,
                logementSocial: false,
              },
            ],
          },
        ],
      }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "4" }),
    });

    // THEN — the route's zod parse converts the booleans:
    // qpv true → placesAutorisees (10), logementSocial false → 0
    expect(response.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        adresses: [
          expect.objectContaining({
            adresseTypologies: [
              expect.objectContaining({
                placesAutorisees: 10,
                qpv: 10,
                logementSocial: 0,
              }),
            ],
          }),
        ],
      }),
      false
    );
  });

  it("retourne 400 quand le payload ne correspond pas au schéma", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });

    const request = new Request("http://localhost/api/structures/abc", {
      method: "PUT",
      body: JSON.stringify({ id: "invalid" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "abc" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
