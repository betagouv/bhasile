import "dayjs/locale/fr";

import dayjs from "dayjs";

import {
  formatDate,
  formatDateToIsoString,
  formatForCharts,
  getElapsedPercentage,
  getLastMonths,
  getMonthsBetween,
  getYearFromDate,
  recursivelySerializeDates,
} from "@/app/utils/date.util";

dayjs.locale("fr");

describe("date util", () => {
  describe("formatDate", () => {
    it("retourne la chaîne d'une date formatée à partir d'une entrée chaîne", () => {
      // GIVEN
      const date = "01/01/2023";

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("01/01/2023");
    });
    it("retourne la chaîne d'une date formatée à partir d'une entrée Date", () => {
      // GIVEN
      const date = new Date("01/01/2023");

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("01/01/2023");
    });
    it("retourne la chaîne d'une date formatée à partir d'une entrée chaîne ISO", () => {
      // GIVEN
      const date = "2023-01-01T12:00:00.000Z";

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("01/01/2023");
    });

    it("retourne la chaîne d'une date formatée à partir d'une entrée chaîne ISO à 00:00:00", () => {
      // GIVEN
      const date = "2023-01-01T00:00:00.000Z";

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("01/01/2023");
    });
    it("retourne la chaîne d'une date formatée en prenant en compte les options", () => {
      // GIVEN
      const date = "2023-01-01T00:00:00.000Z";

      // WHEN
      const formattedDate = formatDate(date, {
        month: "short",
        year: "numeric",
      });

      // THEN
      expect(formattedDate).toBe("janv. 2023");
    });
  });
  describe("formatDateToIsoString", () => {
    it("retourne undefined pour une date null", () => {
      // GIVEN
      const date = null;

      // WHEN
      const result = formatDateToIsoString(date);

      // THEN
      expect(result).toBeUndefined();
    });

    it("retourne undefined pour une date invalide", () => {
      // GIVEN
      const date = "invalid date";

      // WHEN
      const result = formatDateToIsoString(date);

      // THEN
      expect(result).toBeUndefined();
    });

    it("retourne la bonne valeur pour 01/01/2023", () => {
      // GIVEN
      const date = "01/01/2023";

      // WHEN
      const result = formatDateToIsoString(date);

      // THEN
      expect(result).toBe("2023-01-01T12:00:00.000Z");
    });

    it("retourne la bonne valeur pour une date ISO", () => {
      // GIVEN
      const date = "2023-01-01";

      // WHEN
      const result = formatDateToIsoString(date);

      // THEN
      expect(result).toBe("2023-01-01T12:00:00.000Z");
    });
    it("retourne la bonne valeur pour un datetime ISO", () => {
      // GIVEN
      const date = "2023-01-01T00:00:00.000Z";

      // WHEN
      const result = formatDateToIsoString(date);

      // THEN
      expect(result).toBe("2023-01-01T12:00:00.000Z");
    });
  });
  describe("getMonthsBetween", () => {
    it("retourne un tableau vide pour une date de début ou de fin invalide", () => {
      // GIVEN
      const invalidDateStartNull = null;
      const invalidDateEndNull = null;
      const invalidDateStartString = "invalid date";
      const invalidDateEndString = "not a date";
      const validdateEnd = "2025-03-01";
      const validdateStart = "2025-01-01";

      // WHEN
      const result1 = getMonthsBetween(invalidDateStartNull, validdateEnd);
      const result2 = getMonthsBetween(validdateStart, invalidDateEndNull);
      const result3 = getMonthsBetween(invalidDateStartString, validdateEnd);
      const result4 = getMonthsBetween(validdateStart, invalidDateEndString);

      // THEN
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
      expect(result4).toEqual([]);
    });

    it("retourne un tableau vide quand la date de début est postérieure à la date de fin", () => {
      // GIVEN
      const dateStart = "2025-03-01";
      const dateEnd = "2025-01-01";

      // WHEN
      const result = getMonthsBetween(dateStart, dateEnd);

      // THEN
      expect(result).toEqual([]);
    });

    it("retourne un seul mois quand les dates de début et de fin sont dans le même mois", () => {
      // GIVEN
      const dateStart = "2025-02-10";
      const dateEnd = "2025-02-20";

      // WHEN
      const result = getMonthsBetween(dateStart, dateEnd);

      // THEN
      expect(result).toEqual([dayjs("2025-02-01")]);
    });

    it("retourne les bons mois entre deux dates", () => {
      // GIVEN
      const dateStart1 = "2024-12-15";
      const dateEnd1 = "2025-03-01";
      const dateStart2 = "2025-01-01";
      const dateEnd2 = "2025-02-28";
      const dateStart3 = "2025-03-31";
      const dateEnd3 = "2025-05-01";

      // WHEN
      const result1 = getMonthsBetween(dateStart1, dateEnd1);
      const result2 = getMonthsBetween(dateStart2, dateEnd2);
      const result3 = getMonthsBetween(dateStart3, dateEnd3);

      // THEN
      expect(result1).toEqual([
        dayjs("2024-12-01"),
        dayjs("2025-01-01"),
        dayjs("2025-02-01"),
        dayjs("2025-03-01"),
      ]);
      expect(result2).toEqual([dayjs("2025-01-01"), dayjs("2025-02-01")]);
      expect(result3).toEqual([
        dayjs("2025-03-01"),
        dayjs("2025-04-01"),
        dayjs("2025-05-01"),
      ]);
    });

    it("gère les objets Date en entrée", () => {
      // GIVEN
      const dateStart = new Date("2025-01-15");
      const dateEnd = new Date("2025-03-10");

      // WHEN
      const result = getMonthsBetween(
        dateStart.toISOString(),
        dateEnd.toISOString()
      );

      // THEN
      expect(result).toEqual([
        dayjs("2025-01-01"),
        dayjs("2025-02-01"),
        dayjs("2025-03-01"),
      ]);
    });
  });

  describe("getLastMonths", () => {
    it("retourne un tableau vide quand numberOfMonths est nul ou négatif", () => {
      // GIVEN
      const zeroMonths = 0;
      const negativeMonths = -3;

      // WHEN
      const resultZero = getLastMonths(zeroMonths);
      const resultNegative = getLastMonths(negativeMonths);

      // THEN
      expect(resultZero).toEqual([]);
      expect(resultNegative).toEqual([]);
    });

    it("retourne les N derniers mois en incluant le mois en cours", () => {
      // GIVEN
      const mockedDate = dayjs("2025-04-10");
      vi.useFakeTimers();
      vi.setSystemTime(mockedDate.toDate());
      const numberOfMonths1 = 1;
      const numberOfMonths3 = 3;
      const numberOfMonths6 = 6;

      // WHEN
      const result1 = getLastMonths(numberOfMonths1);
      const result3 = getLastMonths(numberOfMonths3);
      const result6 = getLastMonths(numberOfMonths6);

      // THEN
      expect(result1).toEqual([dayjs("2025-04-10")]);
      expect(result3).toEqual([
        dayjs("2025-02-10"),
        dayjs("2025-03-10"),
        dayjs("2025-04-10"),
      ]);
      expect(result6).toEqual([
        dayjs("2024-11-10"),
        dayjs("2024-12-10"),
        dayjs("2025-01-10"),
        dayjs("2025-02-10"),
        dayjs("2025-03-10"),
        dayjs("2025-04-10"),
      ]);
      vi.useRealTimers();
    });
  });

  describe("formatForCharts", () => {
    it("formate une date en français quand on passe une date valide", () => {
      // GIVEN
      const date = dayjs("02-02-2025");

      // WHEN
      const result = formatForCharts(date);

      // THEN
      expect(result).toBe("FÉVR. 2025");
    });
  });

  describe("getYearFromDate", () => {
    describe("when input is a string with DD/MM/YYYY format", () => {
      it("extrait l'année d'une chaîne DD/MM/YYYY valide", () => {
        // GIVEN
        const date = "25/12/2022";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2022);
      });
    });

    describe("when input is a string with other valid date formats", () => {
      it("parse une chaîne de date ISO et retourne la bonne année", () => {
        // GIVEN
        const date = "2024-01-01T12:00:00.000Z";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("parse une chaîne de date ISO à 00:00:00 et retourne la bonne année", () => {
        // GIVEN
        const date = "2024-01-01T00:00:00.000Z";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("parse le format YYYY-MM-DD et retourne l'année", () => {
        // GIVEN
        const date = "2025-12-31";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });

      it("parse une chaîne de date GMT et retourne l'année", () => {
        // GIVEN
        const date = "Mon, 01 Jan 2024 00:00:00 GMT";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("parse un format jour/mois à un seul chiffre en se rabattant sur le parsing Date", () => {
        // GIVEN
        const date = "1/1/2025";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });

      it("parse une chaîne de date ISO en toute fin de journée et retourne la bonne année", () => {
        // GIVEN
        const date = "2024-12-31T23:59:59.999Z";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });
    });

    describe("when input is a string with invalid date", () => {
      it("retourne 0 pour une chaîne de date invalide", () => {
        // GIVEN
        const date = "not-a-date";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(0);
      });

      it("retourne 0 pour une chaîne vide", () => {
        // GIVEN
        const date = "";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(0);
      });
    });

    describe("when input is a Date instance", () => {
      it("retourne l'année complète à partir d'un objet Date", () => {
        // GIVEN
        const date = new Date("2024-06-15T10:30:00Z");

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("retourne l'année complète à partir d'une Date créée avec année, mois, jour", () => {
        // GIVEN
        const date = new Date(Date.UTC(2025, 0, 1));

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });

      it("utilise l'année UTC, pas l'année locale du runner, juste à une bordure d'année", () => {
        // GIVEN
        const date = new Date("2024-12-31T23:30:00.000Z");

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });
    });

    describe("when input is a number", () => {
      it("retourne le nombre tel quel", () => {
        // GIVEN
        const year = 2024;

        // WHEN
        const result = getYearFromDate(year);

        // THEN
        expect(result).toBe(2024);
      });
    });
  });

  describe("getElapsedPercentage", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("retourne 0 quand maintenant est avant la date de début", () => {
      // GIVEN
      const mockedNow = dayjs("2025-01-01T00:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(mockedNow.toDate());

      const dateStart = "2025-02-01T00:00:00Z";
      const dateEnd = "2025-03-01T00:00:00Z";

      // WHEN
      const result = getElapsedPercentage({ dateStart, dateEnd });

      // THEN
      expect(result).toBe(0);
    });

    it("retourne 100 quand maintenant est après la date de fin", () => {
      // GIVEN
      const mockedNow = dayjs("2025-04-01T00:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(mockedNow.toDate());

      const dateStart = "2025-02-01T00:00:00Z";
      const dateEnd = "2025-03-01T00:00:00Z";

      // WHEN
      const result = getElapsedPercentage({ dateStart, dateEnd });

      // THEN
      expect(result).toBe(100);
    });

    it("retourne un pourcentage intermédiaire quand maintenant est entre le début et la fin", () => {
      // GIVEN
      const mockedNow = dayjs("2025-02-15T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(mockedNow.toDate());

      const dateStart = "2025-02-01T00:00:00Z";
      const dateEnd = "2025-03-01T00:00:00Z";

      // WHEN
      const result = getElapsedPercentage({ dateStart, dateEnd });

      // THEN
      const start = dayjs(dateStart);
      const end = dayjs(dateEnd);
      const total = end.diff(start, "millisecond");
      const elapsed = mockedNow.diff(start, "millisecond");
      const expected = Math.min(100, Math.max(0, (elapsed / total) * 100));

      expect(result).toBeCloseTo(expected, 3);
    });

    it("retourne 0 quand maintenant est égal à la date de début", () => {
      // GIVEN
      const mockedNow = dayjs("2025-02-01T00:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(mockedNow.toDate());

      const dateStart = "2025-02-01T00:00:00Z";
      const dateEnd = "2025-03-01T00:00:00Z";

      // WHEN
      const result = getElapsedPercentage({ dateStart, dateEnd });

      // THEN
      expect(result).toBe(0);
    });

    it("retourne 100 quand maintenant est égal à la date de fin", () => {
      // GIVEN
      const mockedNow = dayjs("2025-03-01T00:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(mockedNow.toDate());

      const dateStart = "2025-02-01T00:00:00Z";
      const dateEnd = "2025-03-01T00:00:00Z";

      // WHEN
      const result = getElapsedPercentage({ dateStart, dateEnd });

      // THEN
      expect(result).toBe(100);
    });
  });

  describe("recursivelySerializeDates", () => {
    it("convertit correctement une Date au premier instant de l'année", () => {
      // GIVEN
      const date = new Date("2024-01-01T00:00:00.000Z");

      // WHEN
      const result = recursivelySerializeDates(date);

      // THEN
      expect(result).toBe("2024-01-01T00:00:00.000Z");
    });

    it("convertit correctement une Date au dernier instant de l'année", () => {
      // GIVEN
      const date = new Date("2024-12-31T23:59:59.999Z");

      // WHEN
      const result = recursivelySerializeDates(date);

      // THEN
      expect(result).toBe("2024-12-31T23:59:59.999Z");
    });

    it("convertit correctement les Dates au sein d'objets et de tableaux profondément imbriqués", () => {
      // GIVEN
      const input = {
        name: "test",
        createdAt: new Date("2025-03-10T08:15:30.000Z"),
        nested: {
          updatedAt: new Date("2025-04-20T18:45:00.500Z"),
          history: [
            new Date("2024-06-15T12:30:45.123Z"),
            {
              milestones: [
                { at: new Date("2024-08-01T00:00:00.000Z") },
                ["keep", new Date("2024-09-30T23:59:59.999Z"), 42],
              ],
            },
          ],
        },
      };

      // WHEN
      const result = recursivelySerializeDates(input);

      // THEN
      expect(result).toEqual({
        name: "test",
        createdAt: "2025-03-10T08:15:30.000Z",
        nested: {
          updatedAt: "2025-04-20T18:45:00.500Z",
          history: [
            "2024-06-15T12:30:45.123Z",
            {
              milestones: [
                { at: "2024-08-01T00:00:00.000Z" },
                ["keep", "2024-09-30T23:59:59.999Z", 42],
              ],
            },
          ],
        },
      });
    });

    it("retourne la valeur inchangée quand ce n'est pas une Date", () => {
      // GIVEN
      const input = "not a date";

      // WHEN
      const result = recursivelySerializeDates(input);

      // THEN
      expect(result).toBe("not a date");
    });
  });
});
