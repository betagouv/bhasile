import "dayjs/locale/fr";

import dayjs from "dayjs";

import {
  formatDate,
  formatForCharts,
  getElapsedPercentage,
  getLastMonths,
  getMonthsBetween,
  getYearDate,
  getYearFromDate,
  parseFrDate,
} from "@/app/utils/date.util";

dayjs.locale("fr");

describe("date util", () => {
  describe("formatDate", () => {
    it("should return the string of a formatted date with a string input", () => {
      // GIVEN
      const date = "12/12/2012";

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("12/12/2012");
    });
    it("should return the string of a formatted date with a date input", () => {
      // GIVEN
      const date = new Date("12/12/2012");

      // WHEN
      const formattedDate = formatDate(date);

      // THEN
      expect(formattedDate).toBe("12/12/2012");
    });
  });
  describe("getMonthsBetween", () => {
    it("should return an empty array for invalid start or end date", () => {
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

    it("should return an empty array if start date is after end date", () => {
      // GIVEN
      const dateStart = "2025-03-01";
      const dateEnd = "2025-01-01";

      // WHEN
      const result = getMonthsBetween(dateStart, dateEnd);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return a single month if start and end dates are in the same month", () => {
      // GIVEN
      const dateStart = "2025-02-10";
      const dateEnd = "2025-02-20";

      // WHEN
      const result = getMonthsBetween(dateStart, dateEnd);

      // THEN
      expect(result).toEqual([dayjs("2025-02-01")]);
    });

    it("should return the correct months between two dates", () => {
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

    it("should handle Date objects as input", () => {
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
    it("should return an empty array if numberOfMonths is zero or negative", () => {
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

    it("should return the last N months including the current month", () => {
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
    it("should format a date in french when given a valid date", () => {
      // GIVEN
      const date = dayjs("02-02-2025");

      // WHEN
      const result = formatForCharts(date);

      // THEN
      expect(result).toBe("FÉVR. 2025");
    });
  });

  describe("getYearDate", () => {
    it("should return the date for January 1st at 13:00 for a given year as a string", () => {
      // GIVEN
      const year = "2020";

      // WHEN
      const result = getYearDate(year);

      // THEN
      expect(result).toMatch(/^(0?1\/0?1\/2020|2020-01-01|1\/1\/2020)$/);
    });
  });

  describe("parseFrDate", () => {
    it('should parse a valid "DD/MM/YYYY" string to a Date object', () => {
      // GIVEN
      const dateStr = "25/12/2022";

      // WHEN
      const result = parseFrDate(dateStr);

      // THEN
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getFullYear()).toBe(2022);
      expect((result as Date).getMonth()).toBe(11);
      expect((result as Date).getDate()).toBe(25);
    });

    it("should return the input if string is not a valid date", () => {
      // GIVEN
      const input = "32/13/2022";

      // WHEN
      const result = parseFrDate(input);

      // THEN
      expect(result).toBe(input);
    });

    it("should parse leap year dates correctly", () => {
      // GIVEN
      const input = "29/02/2024";

      // WHEN
      const result = parseFrDate(input);

      // THEN
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getFullYear()).toBe(2024);
      expect((result as Date).getMonth()).toBe(1);
      expect((result as Date).getDate()).toBe(29);
    });
  });

  describe("getYearFromDate", () => {
    describe("when input is a string with DD/MM/YYYY format", () => {
      it("should extract the year from a valid DD/MM/YYYY string", () => {
        // GIVEN
        const date = "25/12/2022";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2022);
      });
    });

    describe("when input is a string with other valid date formats", () => {
      it("should parse ISO date string and return the year", () => {
        // GIVEN
        const date = "2024-03-15T10:30:00.000Z";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("should parse YYYY-MM-DD format and return the year", () => {
        // GIVEN
        const date = "2025-12-31";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });

      it("should parse GMT date string and return the year", () => {
        // GIVEN
        const date = "Mon, 01 Jan 2024 00:00:00 GMT";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("should parse single digit day/month format by falling back to Date parsing", () => {
        // GIVEN
        const date = "1/1/2025";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });

      it("should parse really late ISO date string and return the correct year", () => {
        // GIVEN
        const date = "2024-12-31T23:59:59.999Z";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });
    });

    describe("when input is a string with invalid date", () => {
      it("should return -1 for invalid date string", () => {
        // GIVEN
        const date = "not-a-date";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(-1);
      });

      it("should return -1 for empty string", () => {
        // GIVEN
        const date = "";

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(-1);
      });
    });

    describe("when input is a Date instance", () => {
      it("should return the full year from a Date object", () => {
        // GIVEN
        const date = new Date("2024-06-15T10:30:00Z");

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2024);
      });

      it("should return the full year from a Date created with year, month, day", () => {
        // GIVEN
        const date = new Date(2025, 0, 1);

        // WHEN
        const result = getYearFromDate(date);

        // THEN
        expect(result).toBe(2025);
      });
    });

    describe("when input is a number", () => {
      it("should return the number as-is", () => {
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

    it("should return 0 when now is before the start date", () => {
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

    it("should return 100 when now is after the end date", () => {
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

    it("should return an intermediate percentage when now is between start and end", () => {
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

    it("should return 0 when now equals the start date", () => {
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

    it("should return 100 when now equals the end date", () => {
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
});
