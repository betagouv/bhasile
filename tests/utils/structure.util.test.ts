import dayjs from "dayjs";

import {
  getCpomStructureIndexAndCpomMillesimeIndexForAYear,
  getCurrentCpomStructureDates,
  getLastVisitInMonths,
  getMillesimeIndexForAYear,
  getPlacesByCommunes,
  getRepartition,
  isStructureAutorisee,
  isStructureInCpom,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { ControleApiType } from "@/schemas/api/controle.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { StructureType } from "@/types/structure.type";

import { Repartition } from "../../src/types/adresse.type";
import { createAdresse } from "../test-utils/adresse.factory";
import { createAdresseTypologie } from "../test-utils/adresse-typologie.factory";
import { createControle } from "../test-utils/controle.factory";
import { createEvaluation } from "../test-utils/evaluation.factory";
import { createStructure } from "../test-utils/structure.factory";
import { createStructureTypologie } from "../test-utils/structure-typologie.factory";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

describe("structure util", () => {
  describe("getPlacesByCommunes", () => {
    it("should return an empty object when given an empty array", () => {
      // GIVEN
      const adresses: AdresseApiType[] = [];

      // WHEN
      const placesByCommune = getPlacesByCommunes(adresses);

      // THEN
      expect(placesByCommune).toStrictEqual({});
    });
    it("should return correct places by commune when given a adresses array", () => {
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

  describe("getRepartition", () => {
    it("should return Collectif when given no adresses", () => {
      // GIVEN
      const structure = createStructure({ id: 1, adresses: [] });

      // WHEN
      const repartition = getRepartition(structure);

      // THEN
      expect(repartition).toBe(Repartition.COLLECTIF);
    });
    it("should return Collectif when given adresses with only collectif", () => {
      // GIVEN
      const adresses = [
        createAdresse({ repartition: Repartition.COLLECTIF }),
        createAdresse({ repartition: Repartition.COLLECTIF }),
      ];
      const structure = createStructure({ id: 2, adresses });

      // WHEN
      const repartition = getRepartition(structure);

      // THEN
      expect(repartition).toBe(Repartition.COLLECTIF);
    });
    it("should return Diffus when given adresses with only diffus", () => {
      // GIVEN
      const adresses = [
        createAdresse({ repartition: Repartition.DIFFUS }),
        createAdresse({ repartition: Repartition.DIFFUS }),
      ];
      const structure = createStructure({ id: 3, adresses });

      // WHEN
      const repartition = getRepartition(structure);

      // THEN
      expect(repartition).toBe(Repartition.DIFFUS);
    });
    it("should return Mixte when given adresses with diffus and collectif", () => {
      const adresses = [
        createAdresse({ repartition: Repartition.COLLECTIF }),
        createAdresse({ repartition: Repartition.DIFFUS }),
      ];
      const structure = createStructure({ id: 4, adresses });

      // WHEN
      const repartition = getRepartition(structure);

      // THEN
      expect(repartition).toBe(Repartition.MIXTE);
    });
  });
  describe("getLastVisitInMonths", () => {
    it("should return 0 when both arrays are empty", () => {
      // GIVEN
      const evaluations: EvaluationApiType[] = [];
      const controles: ControleApiType[] = [];

      // WHEN
      const result = getLastVisitInMonths(evaluations, controles);

      // THEN
      expect(result).toBe(0);
    });

    it("should return the difference in months from the most recent evaluation when controles array is empty", () => {
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

    it("should return the difference in months from the most recent controle when evaluations array is empty", () => {
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

    it("should return the difference in months from the most recent evaluation when it is later than the last controle", () => {
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

    it("should return the difference in months from the most recent controle when it is later than the last evaluation", () => {
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
    it("should return true when given a CADA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CADA);

      // THEN
      expect(result).toBe(true);
    });
    it("should return true when given a CPH", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CPH);

      // THEN
      expect(result).toBe(true);
    });
    it("should return false when given a CAES", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.CAES);

      // THEN
      expect(result).toBe(false);
    });
    it("should return false when given a HUDA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.HUDA);

      // THEN
      expect(result).toBe(false);
    });
    it("should return false when given a PRAHDA", () => {
      // WHEN
      const result = isStructureAutorisee(StructureType.PRAHDA);

      // THEN
      expect(result).toBe(false);
    });
  });
  describe("isStructureSubventionnee", () => {
    it("should return false when given a CADA", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CADA);

      // THEN
      expect(result).toBe(false);
    });
    it("should return false when given a CPH", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CPH);

      // THEN
      expect(result).toBe(false);
    });
    it("should return true when given a CAES", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.CAES);

      // THEN
      expect(result).toBe(true);
    });
    it("should return true when given a HUDA", () => {
      // WHEN
      const result = isStructureSubventionnee(StructureType.HUDA);

      // THEN
      expect(result).toBe(true);
    });
    it("should return false when given a PRAHDA", () => {
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

    it("should return true when there is a cpomMillesime for the current year", () => {
      // GIVEN
      const structure = createStructure({
        id: 1,
        cpomStructures: [
          {
            id: 1,
            cpomId: 1,
            structureId: 1,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
              cpomMillesimes: [
                {
                  id: 1,
                  year: 2025,
                },
              ],
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(structure);

      // THEN
      expect(result).toBe(true);
    });

    it("should return false when there is no cpomMillesime for the current year", () => {
      // GIVEN
      const structure = createStructure({
        id: 2,
        cpomStructures: [
          {
            id: 2,
            cpomId: 1,
            structureId: 2,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
              cpomMillesimes: [
                {
                  id: 1,
                  year: 2024,
                },
                {
                  id: 2,
                  year: 2026,
                },
              ],
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(structure);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when cpomStructures is undefined", () => {
      // GIVEN
      const structure = createStructure({
        id: 3,
        cpomStructures: [],
      });
      structure.cpomStructures = undefined;

      // WHEN
      const result = isStructureInCpom(structure);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when cpomStructures is an empty array", () => {
      // GIVEN
      const structure = createStructure({
        id: 4,
        cpomStructures: [],
      });

      // WHEN
      const result = isStructureInCpom(structure);

      // THEN
      expect(result).toBe(false);
    });

    it("should return true when there are multiple cpomStructures and one has a cpomMillesime for the current year", () => {
      // GIVEN
      const structure = createStructure({
        id: 5,
        cpomStructures: [
          {
            id: 3,
            cpomId: 1,
            structureId: 5,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              name: "CPOM Test 1",
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2024-12-31T23:59:59.999Z",
              cpomMillesimes: [
                {
                  id: 1,
                  year: 2024,
                },
              ],
            },
          },
          {
            id: 4,
            cpomId: 2,
            structureId: 5,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 2,
              name: "CPOM Test 2",
              debutCpom: "2025-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
              cpomMillesimes: [
                {
                  id: 2,
                  year: 2025,
                },
              ],
            },
          },
        ],
      });

      // WHEN
      const result = isStructureInCpom(structure);

      // THEN
      expect(result).toBe(true);
    });

    it("should return false when cpomMillesimes is undefined or empty", () => {
      // GIVEN
      const structure1 = createStructure({
        id: 6,
        cpomStructures: [
          {
            id: 5,
            cpomId: 1,
            structureId: 6,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
              cpomMillesimes: undefined,
            },
          },
        ],
      });

      const structure2 = createStructure({
        id: 7,
        cpomStructures: [
          {
            id: 6,
            cpomId: 1,
            structureId: 7,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              name: "CPOM Test",
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
              cpomMillesimes: [],
            },
          },
        ],
      });

      // WHEN
      const result1 = isStructureInCpom(structure1);
      const result2 = isStructureInCpom(structure2);

      // THEN
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe("getCurrentCpomStructureDates", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return structure-specific dates when CPOM is currently active", () => {
      // GIVEN
      const structure = createStructure({
        id: 1,
        cpomStructures: [
          {
            id: 1,
            cpomId: 1,
            structureId: 1,
            dateDebut: "2025-01-01T00:00:00.000Z",
            dateFin: "2025-12-31T23:59:59.999Z",
            cpom: {
              id: 1,
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2026-12-31T23:59:59.999Z",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        debutCpom: "2025-01-01T00:00:00.000Z",
        finCpom: "2025-12-31T23:59:59.999Z",
      });
    });

    it("should return CPOM fallback dates when structure-specific dates are null", () => {
      // GIVEN
      const mockedDate = dayjs("2025-06-15");
      vi.useFakeTimers();
      vi.setSystemTime(mockedDate.toDate());

      const structure = createStructure({
        id: 2,
        cpomStructures: [
          {
            id: 2,
            cpomId: 1,
            structureId: 1,
            dateDebut: null,
            dateFin: null,
            cpom: {
              id: 1,
              debutCpom: "2025-01-01T00:00:00.000Z",
              finCpom: "2025-12-31T23:59:59.999Z",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        debutCpom: "2025-01-01T00:00:00.000Z",
        finCpom: "2025-12-31T23:59:59.999Z",
      });
    });

    it("should return empty object when no CPOM structure is currently active", () => {
      // GIVEN
      const structure = createStructure({
        id: 3,
        cpomStructures: [
          {
            id: 3,
            cpomId: 1,
            structureId: 1,
            dateDebut: "2024-01-01T00:00:00.000Z",
            dateFin: "2024-12-31T23:59:59.999Z",
            cpom: {
              id: 1,
              debutCpom: "2024-01-01T00:00:00.000Z",
              finCpom: "2024-12-31T23:59:59.999Z",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({});
    });

    it("should return empty object when cpomStructures is undefined or empty", () => {
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

    it("should handle mixed null structure dates correctly", () => {
      // GIVEN
      const structure = createStructure({
        id: 6,
        cpomStructures: [
          {
            id: 6,
            cpomId: 1,
            structureId: 1,
            dateDebut: "2025-03-01T00:00:00.000Z",
            dateFin: null,
            cpom: {
              id: 1,
              debutCpom: "2025-01-01T00:00:00.000Z",
              finCpom: "2025-12-31T23:59:59.999Z",
            },
          },
        ],
      });

      // WHEN
      const result = getCurrentCpomStructureDates(structure);

      // THEN
      expect(result).toEqual({
        debutCpom: "2025-03-01T00:00:00.000Z",
        finCpom: "2025-12-31T23:59:59.999Z",
      });
    });
  });

  describe("getMillesimeIndexForAYear", () => {
    it("should return the correct index when the year exists in the array", () => {
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

    it("should return -1 when the year does not exist in the array", () => {
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

    it("should use CURRENT_YEAR as default when no year is provided", () => {
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

    it("should return -1 when the array is empty", () => {
      // GIVEN
      const structureTypologies: StructureTypologieApiType[] = [];

      // WHEN
      const result = getMillesimeIndexForAYear(structureTypologies, 2025);

      // THEN
      expect(result).toBe(-1);
    });
  });

  describe("getMillesimeIndexForAYear", () => {
    it("should return the correct index when the year exists in the array", () => {
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

    it("should return -1 when the year does not exist in the array", () => {
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

    it("should use CURRENT_YEAR as default when no year is provided", () => {
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

    it("should return -1 when the array is empty", () => {
      // GIVEN
      const structureMillesimes: StructureMillesimeApiType[] = [];

      // WHEN
      const result = getMillesimeIndexForAYear(structureMillesimes, 2025);

      // THEN
      expect(result).toBe(-1);
    });
  });

  describe("getCpomStructureIndexAndCpomMillesimeIndexForAYear", () => {
    it("should return correct indices when finding matching structure and millesime", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2025,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, cpomMillesimeIndex: 0 });
    });

    it("should return -1 for both indices when given empty array", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({
        cpomStructureIndex: -1,
        cpomMillesimeIndex: -1,
      });
    });

    it("should return -1 for both indices when no structure has matching year", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2024,
              },
              {
                id: 2,
                year: 2026,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({
        cpomStructureIndex: -1,
        cpomMillesimeIndex: -1,
      });
    });

    it("should return indices for first structure when it has matching year", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2025,
              },
            ],
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 2,
                year: 2025,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, cpomMillesimeIndex: 0 });
    });

    it("should return indices for later structure when first does not match", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2024-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2024,
              },
            ],
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            debutCpom: "2025-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 2,
                year: 2025,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 1, cpomMillesimeIndex: 0 });
    });

    it("should skip structure undefined cpomMillesimes", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test 1",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2024-12-31T23:59:59.999Z",
            cpomMillesimes: undefined,
          },
        },
        {
          id: 2,
          cpomId: 2,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 2,
            name: "CPOM Test 2",
            debutCpom: "2025-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 2,
                year: 2025,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 1, cpomMillesimeIndex: 0 });
    });

    it("should return correct millesime index when structure has multiple millesimes", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2024,
              },
              {
                id: 2,
                year: 2025,
              },
              {
                id: 3,
                year: 2026,
              },
            ],
          },
        },
      ];

      // WHEN
      const result = getCpomStructureIndexAndCpomMillesimeIndexForAYear(
        cpomStructures,
        2025
      );

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, cpomMillesimeIndex: 1 });
    });

    it("should use CURRENT_YEAR as default when no year is provided", () => {
      // GIVEN
      const cpomStructures: CpomStructureApiType[] = [
        {
          id: 1,
          cpomId: 1,
          structureId: 1,
          dateDebut: null,
          dateFin: null,
          cpom: {
            id: 1,
            name: "CPOM Test",
            debutCpom: "2024-01-01T00:00:00.000Z",
            finCpom: "2026-12-31T23:59:59.999Z",
            cpomMillesimes: [
              {
                id: 1,
                year: 2025,
              },
            ],
          },
        },
      ];

      // WHEN
      const result =
        getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures);

      // THEN
      expect(result).toEqual({ cpomStructureIndex: 0, cpomMillesimeIndex: 0 });
    });
  });
});
