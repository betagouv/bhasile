import { subject } from "@casl/ability";
import {
  createDepartementalAgent,
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it } from "vitest";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import {
  AccessRole,
  CpomGranularity,
  Structure,
} from "@/generated/prisma/client";
import {
  canAbilityReadCpom,
  canAbilityReadStructure,
  canAbilityUpdateDepartement,
  canAccessApp,
  canDeleteFile,
  canSaveCpom,
  canUpdateOperateur,
  canUpdateStructure,
  defineAbilityFor,
  getReadableCpomWhere,
  getReadableDepartementNumeros,
  getReadableStructureWhere,
  getUpdatableCpomWhere,
  isAgent,
} from "@/lib/casl";
import { SessionUser } from "@/types/global";

describe("Permissions : canUpdateStructure", () => {
  const structure1 = {
    id: 1,
    departementAdministratif: "1",
    operateurId: 10,
  } as Structure;

  const structure13 = {
    id: 2,
    departementAdministratif: "13",
    operateurId: 20,
  } as Structure;

  const structure69 = {
    id: 3,
    departementAdministratif: "69",
    operateurId: 10,
  } as Structure;

  it("autorise un agent éditeur national à modifier n'importe quelle structure", () => {
    expect(canUpdateStructure(createNationalAgent(), structure69)).toBe(true);
  });

  it("autorise un agent éditeur à modifier une structure de son département", () => {
    expect(
      canUpdateStructure(createDepartementalAgent(["1"]), structure1)
    ).toBe(true);
  });

  it("refuse à un agent de modifier une structure hors de son département malgré son accès lecteur national", () => {
    expect(
      canUpdateStructure(createDepartementalAgent(["69"]), structure13)
    ).toBe(false);
  });

  it("refuse à un agent uniquement lecteur de modifier une structure", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });

    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("autorise un agent admin à modifier une structure de son périmètre", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({
          role: AccessRole.ADMIN,
          departementNumeros: ["13"],
        }),
      ],
    });

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("cumule les binômes de plusieurs niveaux", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({ departementNumeros: ["1"] }),
        createSessionGrant({ structureIds: [2] }),
      ],
    });

    expect(canUpdateStructure(user, structure1)).toBe(true);
    expect(canUpdateStructure(user, structure13)).toBe(true);
    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("garde le rôle le plus fort quand un binôme lecteur est inclus dans un binôme admin", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({
          role: AccessRole.ADMIN,
          departementNumeros: ["1", "69"],
        }),
        createSessionGrant({
          role: AccessRole.LECTEUR,
          departementNumeros: ["69"],
        }),
      ],
    });

    expect(canUpdateStructure(user, structure1)).toBe(true);
    expect(canUpdateStructure(user, structure69)).toBe(true);
  });

  it("limite l'écriture au département admin quand la région n'est que lecteur", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({
          role: AccessRole.LECTEUR,
          departementNumeros: ["1", "69"],
        }),
        createSessionGrant({
          role: AccessRole.ADMIN,
          departementNumeros: ["69"],
        }),
      ],
    });

    expect(canUpdateStructure(user, structure69)).toBe(true);
    expect(canUpdateStructure(user, structure1)).toBe(false);
  });

  it("n'accorde rien à un binôme sans cible", () => {
    const user = createSessionUser({ grants: [createSessionGrant()] });

    expect(canUpdateStructure(user, structure1)).toBe(false);
  });

  it("n'accorde aucune écriture à un utilisateur opérateur", () => {
    const user = createSessionUser({
      operateurId: 10,
      grants: [createSessionGrant({ isNational: true })],
    });

    expect(canUpdateStructure(user, structure1)).toBe(false);
  });

  it("autorise un superadmin sans binôme à tout modifier", () => {
    const user = createSessionUser({ isSuperAdmin: true });

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("refuse à un agent sans binôme de modifier une structure", () => {
    expect(canUpdateStructure(createSessionUser(), structure69)).toBe(false);
  });

  it("refuse à un utilisateur déconnecté de modifier une structure", () => {
    expect(
      canUpdateStructure(undefined as unknown as SessionUser, structure69)
    ).toBe(false);
  });
});

describe("Permissions : binôme de niveau structure", () => {
  const structureEditor = createSessionUser({
    grants: [createSessionGrant({ structureIds: [2] })],
  });

  it("autorise l'édition de la structure visée sans passer par son département", () => {
    expect(
      canUpdateStructure(structureEditor, {
        id: 2,
        departementAdministratif: "13",
      })
    ).toBe(true);
    expect(
      canUpdateStructure(structureEditor, {
        id: 3,
        departementAdministratif: "13",
      })
    ).toBe(false);
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(structureEditor), "13")
    ).toBe(false);
  });

  it("autorise l'édition des seuls CPOM liés à la structure", () => {
    const ability = defineAbilityFor(structureEditor);

    expect(ability.can("update", buildCpom({ structureIds: [2] }))).toBe(true);
    expect(ability.can("update", buildCpom({ structureIds: [3] }))).toBe(false);
  });
});

describe("Permissions : CPOM régionaux", () => {
  const agent59 = createSessionUser({
    grants: [
      createSessionGrant({ departementNumeros: ["59"], regionIds: [7] }),
    ],
  });

  it("couvre les CPOM régionaux de la région d'un binôme départemental ou régional", () => {
    const ability = defineAbilityFor(agent59);

    expect(
      ability.can(
        "update",
        buildCpom({ granularity: "REGIONALE", regionId: 7 })
      )
    ).toBe(true);
    expect(
      ability.can(
        "update",
        buildCpom({ granularity: "REGIONALE", regionId: 8 })
      )
    ).toBe(false);
  });

  it("ne couvre pas un CPOM départemental d'un autre département de la même région", () => {
    expect(
      defineAbilityFor(agent59).can(
        "update",
        buildCpom({
          granularity: "DEPARTEMENTALE",
          regionId: 7,
          departementNumeros: ["62"],
        })
      )
    ).toBe(false);
  });

  it("contrôle la sauvegarde d'un CPOM régional sur sa région", () => {
    const regional = (regionId: number) =>
      buildCpomScope({ granularity: "REGIONALE", regionId });

    expect(canSaveCpom(agent59, regional(7), null)).toBe(true);
    expect(canSaveCpom(agent59, regional(8), null)).toBe(false);
    expect(canSaveCpom(agent59, regional(8), regional(7))).toBe(false);
  });
});

describe("Permissions : CPOM et opérateurs", () => {
  it("autorise un éditeur départemental sur un CPOM au moins en partie lié à son département", () => {
    const ability = defineAbilityFor(createDepartementalAgent(["13"]));

    expect(
      ability.can("update", buildCpom({ departementNumeros: ["13", "84"] }))
    ).toBe(true);
    expect(
      ability.can("update", buildCpom({ departementNumeros: ["69"] }))
    ).toBe(false);
  });

  it("autorise un éditeur national sur tous les CPOM", () => {
    const ability = defineAbilityFor(createNationalAgent());

    expect(ability.can("update", buildCpom({}))).toBe(true);
  });

  it("refuse les CPOM à un agent uniquement lecteur", () => {
    const ability = defineAbilityFor(
      createSessionUser({
        grants: [
          createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
        ],
      })
    );

    expect(
      ability.can("update", buildCpom({ departementNumeros: ["13"] }))
    ).toBe(false);
  });

  it("autorise un agent éditeur, quel que soit son niveau, à modifier tous les opérateurs", () => {
    const structureEditor = createSessionUser({
      grants: [createSessionGrant({ structureIds: [2] })],
    });

    expect(
      defineAbilityFor(structureEditor).can("update", buildOperateur(7))
    ).toBe(true);
    expect(
      defineAbilityFor(createDepartementalAgent(["13"])).can(
        "update",
        buildOperateur(7)
      )
    ).toBe(true);
  });

  it("refuse à un user opérateur, même admin, de modifier son opérateur", () => {
    const ability = defineAbilityFor(
      createSessionUser({
        operateurId: 7,
        grants: [
          createSessionGrant({ role: AccessRole.ADMIN, isNational: true }),
        ],
      })
    );

    expect(ability.can("update", buildOperateur(7))).toBe(false);
  });
});

describe("Permissions : canSaveCpom", () => {
  const agent13 = createDepartementalAgent(["13"]);
  const scope = (departementNumeros: string[]) =>
    buildCpomScope({ departementNumeros });

  it.each([
    {
      cas: "crée un CPOM de son département",
      payload: scope(["13"]),
      existing: null,
      expected: true,
    },
    {
      cas: "crée un CPOM hors de son périmètre",
      payload: scope(["69"]),
      existing: null,
      expected: false,
    },
    {
      cas: "rattache à son département un CPOM existant hors périmètre",
      payload: scope(["13"]),
      existing: scope(["69"]),
      expected: false,
    },
    {
      cas: "sort un CPOM de son périmètre",
      payload: scope(["69"]),
      existing: scope(["13"]),
      expected: false,
    },
    {
      cas: "modifie un CPOM de son département sans renvoyer son périmètre",
      payload: {},
      existing: scope(["13"]),
      expected: true,
    },
    {
      cas: "modifie un CPOM hors périmètre sans renvoyer son périmètre",
      payload: {},
      existing: scope(["69"]),
      expected: false,
    },
  ])(
    "renvoie $expected quand l'agent $cas",
    ({ payload, existing, expected }) => {
      expect(canSaveCpom(agent13, payload, existing)).toBe(expected);
    }
  );
});

describe("Permissions : canUpdateOperateur", () => {
  it("autorise un agent éditeur, refuse un lecteur et un admin opérateur", () => {
    const lecteur = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });
    const operateurAdmin = createSessionUser({
      operateurId: 7,
      grants: [
        createSessionGrant({ role: AccessRole.ADMIN, isNational: true }),
      ],
    });

    expect(canUpdateOperateur(createDepartementalAgent(["13"]), 7)).toBe(true);
    expect(canUpdateOperateur(lecteur, 7)).toBe(false);
    expect(canUpdateOperateur(operateurAdmin, 7)).toBe(false);
  });
});

const buildCpomScope = ({
  granularity,
  regionId,
  departementNumeros = [],
  structureIds = [],
}: {
  granularity?: CpomGranularity;
  regionId?: number;
  departementNumeros?: string[];
  structureIds?: number[];
}) => ({
  granularity,
  regionId,
  departements: departementNumeros.map((numero) => ({
    departement: { numero },
  })),
  structures: structureIds.map((structureId) => ({ structureId })),
});

const buildCpom = (scope: Parameters<typeof buildCpomScope>[0]) =>
  subject("Cpom", buildCpomScope(scope) as never);

const buildOperateur = (id: number) => subject("Operateur", { id } as never);

describe("Permissions : lecture", () => {
  const lecteurVar = createSessionUser({
    grants: [
      createSessionGrant({
        role: AccessRole.LECTEUR,
        departementNumeros: ["83"],
      }),
    ],
  });

  it("limite la lecture des structures aux binômes de l'utilisateur, lecteur compris", () => {
    const ability = defineAbilityFor(lecteurVar);

    expect(
      canAbilityReadStructure(ability, {
        id: 1,
        departementAdministratif: "83",
      })
    ).toBe(true);
    expect(
      canAbilityReadStructure(ability, {
        id: 2,
        departementAdministratif: "01",
      })
    ).toBe(false);
  });

  it("donne la lecture de toutes les structures avec un binôme national", () => {
    const ability = defineAbilityFor(createDepartementalAgent(["75"]));

    expect(
      canAbilityReadStructure(ability, {
        id: 2,
        departementAdministratif: "01",
      })
    ).toBe(true);
  });

  it("limite la lecture des CPOM à ceux liés au moins en partie aux binômes", () => {
    const ability = defineAbilityFor(lecteurVar);

    expect(
      canAbilityReadCpom(ability, {
        departements: [
          { departement: { numero: "06" } },
          { departement: { numero: "83" } },
        ],
        structures: [],
      })
    ).toBe(true);
    expect(
      canAbilityReadCpom(ability, {
        departements: [{ departement: { numero: "01" } }],
        structures: [],
      })
    ).toBe(false);
  });

  it("construit un filtre sur les structures qui reprend les binômes de droits", () => {
    expect(getReadableStructureWhere(lecteurVar)).toEqual({
      OR: [{ departementAdministratif: { in: ["83"] } }],
    });
  });

  it("construit un filtre qui ne renvoie rien sans binôme de droits", () => {
    expect(getReadableStructureWhere(createSessionUser())).toEqual({
      id: { in: [] },
    });
  });

  it("ne filtre rien pour un agent qui lit au niveau national", () => {
    const lecteurNational = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });

    expect(getReadableStructureWhere(lecteurNational)).toEqual({});
    expect(getReadableCpomWhere(lecteurNational)).toEqual({});
    expect(getReadableCpomWhere(createDepartementalAgent(["75"]))).toEqual({});
  });

  it("filtre les CPOM modifiables sur les binômes d'édition seulement", () => {
    const lecteurNational = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });

    expect(getUpdatableCpomWhere(createNationalAgent())).toEqual({});
    expect(getUpdatableCpomWhere(lecteurNational)).toEqual({ id: { in: [] } });
    expect(getUpdatableCpomWhere(createDepartementalAgent(["75"]))).toEqual({
      OR: [
        {
          departements: {
            some: { departement: { is: { numero: { in: ["75"] } } } },
          },
        },
      ],
    });
  });

  it("ne filtre rien pour un superadmin", () => {
    expect(
      getReadableStructureWhere(createSessionUser({ isSuperAdmin: true }))
    ).toEqual({});
  });

  it("refuse la lecture sans utilisateur", () => {
    const ability = defineAbilityFor(undefined);

    expect(
      canAbilityReadStructure(ability, {
        id: 1,
        departementAdministratif: "83",
      })
    ).toBe(false);
    expect(
      canAbilityReadCpom(ability, {
        departements: [{ departement: { numero: "83" } }],
        structures: [],
      })
    ).toBe(false);
  });

  it("liste les départements lisibles, sans limite pour un binôme national", () => {
    expect(getReadableDepartementNumeros(lecteurVar)).toEqual(new Set(["83"]));
    expect(
      getReadableDepartementNumeros(createDepartementalAgent(["75"]))
    ).toBeNull();
    expect(getReadableDepartementNumeros(createSessionUser())).toEqual(
      new Set()
    );
  });

  it("donne la lecture de la fiche d'une structure de son opérateur à un utilisateur opérateur", () => {
    const ability = defineAbilityFor(
      createSessionUser({
        operateurId: 7,
        grants: [
          createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
        ],
      })
    );

    expect(
      canAbilityReadStructure(ability, {
        id: 1,
        departementAdministratif: "83",
        operateurId: 7,
      })
    ).toBe(true);
    expect(
      canAbilityReadStructure(ability, {
        id: 2,
        departementAdministratif: "83",
        operateurId: 8,
      })
    ).toBe(false);
  });

  it("restreint le filtre d'un utilisateur type opérateur à son opérateur", () => {
    const user = createSessionUser({
      operateurId: 7,
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });

    expect(getReadableStructureWhere(user)).toEqual({
      OR: [{ operateurId: 7 }],
    });
  });
});

describe("Permissions : contact non agent", () => {
  const contact = createSessionUser({
    isAgent: false,
    grants: [
      createSessionGrant({ role: AccessRole.LECTEUR, structureIds: [12] }),
    ],
  });

  it("lit la seule structure dont il est contact, sans pouvoir la modifier", () => {
    const ability = defineAbilityFor(contact);

    expect(
      canAbilityReadStructure(ability, {
        id: 12,
        departementAdministratif: "83",
      })
    ).toBe(true);
    expect(
      canAbilityReadStructure(ability, {
        id: 13,
        departementAdministratif: "83",
      })
    ).toBe(false);
    expect(
      canUpdateStructure(contact, { id: 12, departementAdministratif: "83" })
    ).toBe(false);
  });

  it("ne lit aucun CPOM, même lié à sa structure", () => {
    expect(
      canAbilityReadCpom(defineAbilityFor(contact), {
        departements: [],
        structures: [{ structureId: 12 }],
      })
    ).toBe(false);
  });

  it("accède à l'application grâce à ses droits de contact", () => {
    expect(canAccessApp(contact)).toBe(true);
    expect(isAgent(contact)).toBe(false);
  });
});

describe("Permissions : canAccessApp", () => {
  it("refuse l'accès à un utilisateur sans aucun binôme de droits", () => {
    expect(canAccessApp(createSessionUser())).toBe(false);
  });

  it("donne l'accès dès un binôme, même lecteur", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
      ],
    });

    expect(canAccessApp(user)).toBe(true);
  });

  it("donne l'accès à un superadmin sans binôme", () => {
    expect(canAccessApp(createSessionUser({ isSuperAdmin: true }))).toBe(true);
  });

  it("n'accorde aucune lecture à un utilisateur sans binôme", () => {
    expect(
      defineAbilityFor(createSessionUser()).can(
        "read",
        subject("Structure", {} as never)
      )
    ).toBe(false);
  });
});

describe("Permissions : canAbilityUpdateDepartement", () => {
  const nationalUser = createNationalAgent();

  const departementUser = createDepartementalAgent(["50"]);

  it("autorise un agent éditeur national sur n'importe quel département, y compris un département undefined", () => {
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(nationalUser), "50")
    ).toBe(true);
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(nationalUser), "13")
    ).toBe(true);
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(nationalUser), undefined)
    ).toBe(true);
  });

  it("autorise un agent départemental uniquement sur son propre département", () => {
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(departementUser), "50")
    ).toBe(true);
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(departementUser), "13")
    ).toBe(false);
  });

  it("masque les transformations sans département à un agent départemental", () => {
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(departementUser), undefined)
    ).toBe(false);
    expect(
      canAbilityUpdateDepartement(defineAbilityFor(departementUser), null)
    ).toBe(false);
  });
});

describe("Permissions : canDeleteFile", () => {
  const nationalUser = createNationalAgent();

  const dep75User = createDepartementalAgent(["75"]);

  const dep92User = createDepartementalAgent(["92"]);

  const buildFile = (overrides: Partial<FileWithParents>): FileWithParents =>
    ({
      acteAdministratifId: null,
      documentFinancierId: null,
      controleId: null,
      evaluationId: null,
      operateurId: null,
      acteAdministratif: null,
      documentFinancier: null,
      controle: null,
      evaluation: null,
      operateur: null,
      ...overrides,
    }) as unknown as FileWithParents;

  it("autorise n'importe quel agent à supprimer un fichier d'une transformation en cours (acte lié à une structureVersionTransformation)", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: 7,
        structureId: null,
        cpom: null,
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
  });

  it("cloisonne par département la suppression d'un fichier d'acte lié à une structure", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: 10,
        cpom: null,
        operateur: null,
        structure: { departementAdministratif: "75" },
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(true);
    expect(canDeleteFile(dep92User, file)).toBe(false);
  });

  it("cloisonne par département la suppression d'un fichier d'acte lié à un CPOM", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: null,
        cpom: {
          id: 3,
          structures: [],
          departements: [{ departement: { numero: "92" } }],
        },
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
    expect(canDeleteFile(dep75User, file)).toBe(false);
    expect(canDeleteFile(nationalUser, file)).toBe(true);
  });

  it("cloisonne par département la suppression d'un document financier", () => {
    const file = buildFile({
      documentFinancierId: 5,
      documentFinancier: {
        structure: { departementAdministratif: "92" },
      } as unknown as FileWithParents["documentFinancier"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
    expect(canDeleteFile(dep75User, file)).toBe(false);
  });

  it("cloisonne par département la suppression d'un fichier de contrôle", () => {
    const file = buildFile({
      controleId: 8,
      controle: {
        structure: { departementAdministratif: "75" },
      } as unknown as FileWithParents["controle"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(true);
    expect(canDeleteFile(dep92User, file)).toBe(false);
  });

  it("autorise tout agent à supprimer un logo d'opérateur (non scopé par département)", () => {
    const file = buildFile({
      operateurId: 4,
      operateur: { id: 4 } as unknown as FileWithParents["operateur"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
  });

  it("refuse à un agent départemental un fichier dont la structure parente est introuvable, mais autorise un agent NATIONAL", () => {
    const file = buildFile({
      documentFinancierId: 5,
      documentFinancier: {
        structure: null,
      } as unknown as FileWithParents["documentFinancier"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(false);
    expect(canDeleteFile(nationalUser, file)).toBe(true);
  });

  it("refuse par défaut la suppression d'un fichier d'acte rattaché à aucune entité résolvable", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: null,
        cpom: null,
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(nationalUser, file)).toBe(false);
  });
});
