import dayjs from "dayjs";

import { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import {
  getTypeBati,
  isStructureInCpom,
} from "@/app/api/structures/structure.util";
import {
  getCpomStructureIndexAndBudgetIndexForAYearAndAType,
  getCurrentCpomStructureDates,
  getFermetureEvent,
  getLastVisitInMonths,
  getMillesimeIndexForAYear,
  getPlacesByCommunes,
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { ControleApiType } from "@/schemas/api/controle.schema";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { StructureType } from "@/types/structure.type";
import { HistoryEvent } from "@/types/structure-history.type";

import { Repartition } from "../../src/types/adresse.type";
import { createAdresse } from "../test-utils/factories/adresse.factory";
import { createAdresseTypologie } from "../test-utils/factories/adresse-typologie.factory";
import { createControle } from "../test-utils/factories/controle.factory";
import { createEvaluation } from "../test-utils/factories/evaluation.factory";
import { createStructureTypologie } from "../test-utils/factories/structure-typologie.factory";
import { createStructure } from "../test-utils/structure.factory";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

describe("structure util", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  describe("getPlacesByCommunes", () => {
    it("retourne un objet vide quand on passe un tableau vide", () => {
      // GIVEN
      const adresses: AdresseApiType[] = [];

      // WHEN
      const placesByCommune = getPlacesByCommunes(adresses);

      // THEN
      expect(placesByCommune).toStrictEqual({});
    });
    it("ventile correctement les places par commune quand on passe un tableau d'adresses", () => {
      // GIVEN
      const typologie1 = createAdresseTypologie({
        placesAutorisees: 2,
      });
      const typologie2 = createAdresseTypologie({
        placesAutorisees: 3,
      });
      const typologie3 = createAdresseTypologie({
        placesAutorisees: 1,
      });
      const typologie4 = createAdresseTypologie({
        placesAutorisees: 1,
      });

      const adresses: AdresseApiType[] = [
        createAdresse({ id: 1, commune: "Paris", typologies: [typologie1] }),
        createAdresse({ id: 2, commune: "Paris", typologies: [typologie2] }),
        createAdresse({ id: 3, commune: "Rouen", typologies: [typologie3] }),
        createAdresse({ id: 4, commune: "Rouen", typologies: [typologie4] }),
      ];

      // WHEN
      const placesByCommune = getPlacesByCommunes(adresses);

      // THEN
      expect(placesByCommune).toStrictEqual({ Paris: 5, Rouen: 2 });
    });
  });

  describe("getTypeBati", () => {
    it("retourne undefined quand aucune adresse n'est fournie", () => {
      // GIVEN
      const structure = createStructure({ id: 1, adresses: [] });

      // WHEN
      const typeBati = getTypeBati(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(typeBati).toBeUndefined();
    });
    it("retourne Collectif quand toutes les adresses sont en collectif", () => {
      // GIVEN
      const adresses = [
        createAdresse({ repartition: Repartition.COLLECTIF }),
        createAdresse({ repartition: Repartition.COLLECTIF }),
      ];
      const structure = createStructure({ id: 2, adresses });

      // WHEN
      const typeBati = getTypeBati(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(typeBati).toBe(Repartition.COLLECTIF);
    });
    it("retourne Diffus quand toutes les adresses sont en diffus", () => {
      // GIVEN
      const adresses = [
        createAdresse({ repartition: Repartition.DIFFUS }),
        createAdresse({ repartition: Repartition.DIFFUS }),
      ];
      const structure = createStructure({ id: 3, adresses });

      // WHEN
      const typeBati = getTypeBati(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(typeBati).toBe(Repartition.DIFFUS);
    });
    it("retourne Mixte quand les adresses mêlent diffus et collectif", () => {
      const adresses = [
        createAdresse({ repartition: Repartition.COLLECTIF }),
        createAdresse({ repartition: Repartition.DIFFUS }),
      ];
      const structure = createStructure({ id: 4, adresses });

      // WHEN
      const typeBati = getTypeBati(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(typeBati).toBe(Repartition.MIXTE);
    });
  });
  describe("getLastVisitInMonths", () => {
    it("retourne 0 quand les deux tableaux sont vides", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [];
      const controles: ControleApiType[] = [];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(0);
    });

    it("retourne l'écart en mois depuis l'évaluation la plus récente quand le tableau de controles est vide", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [
        createEvaluation({ date: dayjs().subtract(2, "month").toISOString() }),
      ];
      const controles: ControleApiType[] = [];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(2);
    });

    it("retourne l'écart en mois depuis le controle le plus récent quand le tableau d'évaluations est vide", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [];
      const controles: ControleApiType[] = [
        createControle({ date: dayjs().subtract(1, "month").toISOString() }),
      ];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne l'écart en mois depuis l'évaluation la plus récente quand elle est postérieure au dernier controle", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [
        createEvaluation({ date: dayjs().subtract(1, "month").toISOString() }),
      ];
      const controles: ControleApiType[] = [
        createControle({ date: dayjs().subtract(3, "month").toISOString() }),
      ];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne l'écart en mois depuis le controle le plus récent quand il est postérieur à la dernière évaluation", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [
        createEvaluation({ date: dayjs().subtract(4, "month").toISOString() }),
      ];
      const controles: ControleApiType[] = [
        createControle({ date: dayjs().subtract(2, "month").toISOString() }),
      ];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(2);
    });
  });
  describe("isStructureAutorisee", () => {
    it("retourne true pour un CADA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CADA);

      // THEN
      expect(result).toBe(true);
    });
    it("retourne true pour un CPH", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CPH);

      // THEN
      expect(result).toBe(true);
    });
    it("retourne false pour un CAES", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CAES);

      // THEN
      expect(result).toBe(false);
    });
    it("retourne false pour un HUDA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.HUDA);

      // THEN
      expect(result).toBe(false);
    });
    it("retourne false pour un PRAHDA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.PRAHDA);

      // THEN
      expect(result).toBe(false);
    });
  });
  describe("isStructureSubventionnee", () => {
    it("retourne false pour un CADA", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CADA);

      // THEN
      expect(result).toBe(false);
    });
    it("retourne false pour un CPH", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CPH);

      // THEN
      expect(result).toBe(false);
    });
    it("retourne true pour un CAES", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CAES);

      // THEN
      expect(result).toBe(true);
    });
    it("retourne true pour un HUDA", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.HUDA);

      // THEN
      expect(result).toBe(true);
    });
    it("retourne false pour un PRAHDA", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.PRAHDA);

      // THEN
      expect(result).toBe(false);
    });
  });
  describe("isStructureInCpom", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("retourne true quand la plage de dates de la cpomStructure inclut l'année en cours", () => {
      // GIVEN
      const structure = createStructure({
        id: 1,
        cpomStructures: [
          {
            id: 1,
            cpomId: 1,
            structureId: 1,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2026-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              budgets: [
                {
                  id: 1,
                  year: 2025,
                  cpomStructureType: StructureType.CADA,
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(result).toBe(true);
    });

    it("retourne false quand la plage de dates n'inclut pas l'année en cours", () => {
      // GIVEN - CPOM structure dates (2024-2024) do not include current year 2025
      const structure = createStructure({
        id: 2,
        cpomStructures: [
          {
            id: 2,
            cpomId: 1,
            structureId: 2,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2024-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(result).toBe(false);
    });

    it("retourne false quand cpomStructures est undefined", () => {
      // GIVEN
      const structure = createStructure({
        id: 3,
        cpomStructures: [],
      });
      structure.cpomStructures = undefined;

      // WHEN
      const result = isStructureInCpom(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(result).toBe(false);
    });

    it("retourne false quand cpomStructures est un tableau vide", () => {
      // GIVEN
      const structure = createStructure({
        id: 4,
        cpomStructures: [],
      });

      // WHEN
      const result = isStructureInCpom(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(result).toBe(false);
    });

    it("retourne true quand plusieurs cpomStructures existent et que l'une couvre l'année en cours", () => {
      // GIVEN
      const structure = createStructure({
        id: 5,
        cpomStructures: [
          {
            id: 3,
            cpomId: 1,
            structureId: 5,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              name: "CPOM Test 1",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2024-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              budgets: [
                {
                  id: 1,
                  year: 2024,
                  cpomStructureType: StructureType.CADA,
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
          {
            id: 4,
            cpomId: 2,
            structureId: 5,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 2,
              name: "CPOM Test 2",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2025-01-01T00:00:00.000Z",
                  endDate: "2026-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              budgets: [
                {
                  id: 2,
                  year: 2025,
                  cpomStructureType: StructureType.CADA,
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(
        structure as unknown as StructureDbDetails
      );

      // THEN
      expect(result).toBe(true);
    });

    it("retourne false quand dateStart ou dateEnd est absente", () => {
      // GIVEN - cpomStructure has no dates, cpom omitted so no fallback
      const structure1 = createStructure({
        id: 6,
        cpomStructures: [
          {
            id: 5,
            cpomId: 1,
            structureId: 6,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              actesAdministratifs: [],
              budgets: [],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // GIVEN - dateEnd is null (schema requires string but we need to test runtime)
      const structure2 = createStructure({
        id: 7,
        cpomStructures: [
          {
            id: 6,
            cpomId: 1,
            structureId: 7,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2025-01-01T00:00:00.000Z",
                  endDate: undefined,
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result1 = isStructureInCpom(
        structure1 as unknown as StructureDbDetails
      );
      const result2 = isStructureInCpom(
        structure2 as unknown as StructureDbDetails
      );

      // THEN
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe("getCurrentCpomStructureDates", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("retourne les dates propres à la structure quand le CPOM est actif à ce jour", () => {
      // GIVEN
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-15T00:00:00.000Z"));
      const structure = createStructure({
        id: 1,
        cpomStructures: [
          {
            id: 1,
            cpomId: 1,
            structureId: 1,
            dateStart: "2025-01-01T00:00:00.000Z",
            dateEnd: "2025-12-31T23:59:59.999Z",
            cpom: {
              id: 1,
              dateStart: "2025-01-01T00:00:00.000Z",
              dateEnd: "2025-12-31T23:59:59.999Z",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2026-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        dateStart: "2025-01-01T00:00:00.000Z",
        dateEnd: "2025-12-31T23:59:59.999Z",
      });
    });

    it("retombe sur les dates du CPOM quand les dates propres à la structure sont null", () => {
      // GIVEN
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-15T00:00:00.000Z"));

      const structure = createStructure({
        id: 2,
        cpomStructures: [
          {
            id: 2,
            cpomId: 1,
            structureId: 1,
            dateStart: null,
            dateEnd: null,
            cpom: {
              id: 1,
              dateStart: "2025-01-01T00:00:00.000Z",
              dateEnd: "2025-12-31T23:59:59.999Z",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2025-01-01T00:00:00.000Z",
                  endDate: "2025-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        dateStart: "2025-01-01T00:00:00.000Z",
        dateEnd: "2025-12-31T23:59:59.999Z",
      });
    });

    it("retourne un objet vide quand aucune cpomStructure n'est active à ce jour", () => {
      // GIVEN
      const structure = createStructure({
        id: 3,
        cpomStructures: [
          {
            id: 3,
            cpomId: 1,
            structureId: 1,
            dateStart: "2024-01-01T00:00:00.000Z",
            dateEnd: "2024-12-31T23:59:59.999Z",
            cpom: {
              id: 1,
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2024-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({});
    });

    it("retourne un objet vide quand cpomStructures est undefined ou vide", () => {
      // GIVEN
      const structure1 = createStructure({ id: 4 });
      structure1.cpomStructures = undefined;

      const structure2 = createStructure({ id: 5, cpomStructures: [] });

      // WHEN
      const result1 = getCurrentCpomStructureDates(structure1);
      const result2 = getCurrentCpomStructureDates(structure2);

      // THEN
      expect(result1).toEqual({});
      expect(result2).toEqual({});
    });

    it("gère correctement un mélange de dates de structure null et renseignées", () => {
      // GIVEN
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-05-15T00:00:00.000Z"));
      const structure = createStructure({
        id: 6,
        cpomStructures: [
          {
            id: 6,
            cpomId: 1,
            structureId: 1,
            dateStart: "2025-03-01T00:00:00.000Z",
            dateEnd: null,
            cpom: {
              id: 1,
              dateStart: "2025-01-01T00:00:00.000Z",
              dateEnd: "2025-12-31T23:59:59.999Z",
              actesAdministratifs: [
                {
                  fileUploads: [
                    {
                      key: "test-key",
                    },
                  ],
                  startDate: "2025-01-01T00:00:00.000Z",
                  endDate: "2025-12-31T23:59:59.999Z",
                  category: "CONVENTION_CPOM",
                },
              ],
              granularity: "DEPARTEMENTALE",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        dateStart: "2025-03-01T00:00:00.000Z",
        dateEnd: "2025-12-31T23:59:59.999Z",
      });
    });
  });

  describe("getMillesimeIndexForAYear", () => {
    it("retourne le bon index quand l'année existe dans le tableau", () => {
      // GIVEN
      const structureTypologies = [
        createStructureTypologie(),
        createStructureTypologie({ year: 2024 }),
        createStructureTypologie({ year: 2025 }),
        createStructureTypologie({ year: 2026 }),
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureTypologies, 2024);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne -1 quand l'année n'existe pas dans le tableau", () => {
      // GIVEN
      const structureTypologies = [
        createStructureTypologie(),
        createStructureTypologie({ year: 2024 }),
        createStructureTypologie({ year: 2026 }),
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureTypologies, 2025);

      // THEN
      expect(result).toBe(-1);
    });

    it("utilise CURRENT_YEAR par défaut quand aucune année n'est fournie", () => {
      // GIVEN
      const structureTypologies = [
        createStructureTypologie({ year: 2024 }),
        createStructureTypologie({ year: 2025 }),
        createStructureTypologie({ year: 2026 }),
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureTypologies);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne -1 quand le tableau est vide", () => {
      // GIVEN
      const structureTypologies: StructureTypologieApiType[] = [];

      // WHEN
      const result = getMillesimeIndexForAYear(structureTypologies, 2025);

      // THEN
      expect(result).toBe(-1);
    });

    it("retourne -1 quand le tableau est undefined (watch() pas encore hydraté)", () => {
      // WHEN
      const result = getMillesimeIndexForAYear(undefined, 2025);

      // THEN
      expect(result).toBe(-1);
    });
  });

  describe("getMillesimeIndexForAYear", () => {
    it("retourne le bon index quand l'année existe dans le tableau", () => {
      // GIVEN
      const structureMillesimes = [
        { year: 2023, cpom: false, operateurComment: null },
        { year: 2024, cpom: true, operateurComment: null },
        { year: 2025, cpom: false, operateurComment: null },
        { year: 2026, cpom: true, operateurComment: null },
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureMillesimes, 2024);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne -1 quand l'année n'existe pas dans le tableau", () => {
      // GIVEN
      const structureMillesimes = [
        { year: 2023, cpom: false, operateurComment: null },
        { year: 2024, cpom: true, operateurComment: null },
        { year: 2026, cpom: false, operateurComment: null },
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureMillesimes, 2025);

      // THEN
      expect(result).toBe(-1);
    });

    it("utilise CURRENT_YEAR par défaut quand aucune année n'est fournie", () => {
      // GIVEN
      const structureMillesimes = [
        { year: 2024, cpom: false, operateurComment: null },
        { year: 2025, cpom: true, operateurComment: null },
        { year: 2026, cpom: false, operateurComment: null },
      ];

      // WHEN
      const result = getMillesimeIndexForAYear(structureMillesimes);

      // THEN
      expect(result).toBe(1);
    });

    it("retourne -1 quand le tableau est vide", () => {
      // GIVEN
      const structureMillesimes: StructureMillesimeApiType[] = [];

      // WHEN
      const result = getMillesimeIndexForAYear(structureMillesimes, 2025);

      // THEN
      expect(result).toBe(-1);
    });
  });

  describe("getCpomStructureIndexAndBudgetIndexForAYearAndAType", () => {
    it("retourne les bons index quand une structure et un millésime correspondent", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, budgetIndex: 0 });
    });

    it("retourne -1 pour les deux index quand on passe un tableau vide", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({
        cpomStructureIndex: -1,
        budgetIndex: -1,
      });
    });

    it("retourne -1 pour les deux index quand aucune structure n'a l'année correspondante", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2024,
                cpomStructureType: StructureType.CADA,
              },
              {
                id: 2,
                year: 2026,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({
        cpomStructureIndex: -1,
        budgetIndex: -1,
      });
    });

    it("retourne les index de la première structure quand elle a l'année correspondante", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 2,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, budgetIndex: 0 });
    });

    it("retourne les index d'une structure ultérieure quand la première ne correspond pas", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2024-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2024,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 2,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 1, budgetIndex: 0 });
    });

    it("ignore les structures dont les budgets sont undefined", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2024-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            budgets: undefined,
            granularity: "DEPARTEMENTALE",
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 2,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 1, budgetIndex: 0 });
    });

    it("retourne le bon index de millésime quand la structure en a plusieurs", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2024,
                cpomStructureType: StructureType.CADA,
              },
              {
                id: 2,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
              {
                id: 3,
                year: 2026,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, budgetIndex: 1 });
    });

    it("utilise CURRENT_YEAR par défaut quand aucune année n'est fournie", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiRead[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateStart: null,
          dateEnd: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            actesAdministratifs: [
              {
                fileUploads: [
                  {
                    key: "test-key",
                  },
                ],
                startDate: "2024-01-01T00:00:00.000Z",
                endDate: "2026-12-31T23:59:59.999Z",
                category: "CONVENTION_CPOM",
              },
            ],
            granularity: "DEPARTEMENTALE",
            budgets: [
              {
                id: 1,
                year: 2025,
                cpomStructureType: StructureType.CADA,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        2025,
        StructureType.CADA
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, budgetIndex: 0 });
    });
  });

  describe("getFermetureEvent", () => {
    const buildStructure = (history?: HistoryEvent[]): StructureApiRead =>
      ({ history }) as StructureApiRead;

    it("retourne l'événement FERMETURE avec sa date et son motif", () => {
      const fermeture: HistoryEvent = {
        kind: "FERMETURE",
        date: "2025-03-19",
        targets: [],
        motif: "Absorption",
      };
      const structure = buildStructure([
        { kind: "CREATION", date: "2020-01-01", sources: [] },
        fermeture,
      ]);

      expect(getFermetureEvent(structure)).toEqual(fermeture);
    });

    it("retourne undefined quand il n'y a pas d'événement FERMETURE", () => {
      const structure = buildStructure([
        { kind: "CREATION", date: "2020-01-01", sources: [] },
      ]);

      expect(getFermetureEvent(structure)).toBeUndefined();
    });

    it("retourne undefined quand history est absent", () => {
      expect(getFermetureEvent(buildStructure())).toBeUndefined();
    });
  });
});
