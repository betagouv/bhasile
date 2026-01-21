import {
  computeAverage,
  convertObjectToArray,
  getPercentage,
  isNullOrUndefined,
  reverseObjectKeyValues,
  sortKeysByValue,
} from "@/app/utils/common.util";

describe("common util", () => {
  describe("sortKeysByValue", () => {
    it("should return an empty object when given an empty object", () => {
      // GIVEN
      const unsortedObject = {};

      // WHEN
      const sortedObject = sortKeysByValue(unsortedObject);

      // THEN
      expect(sortedObject).toStrictEqual({});
    });
    it("should return a sorted object by value when given an unsorted object", () => {
      // GIVEN
      const unsortedObject = {
        a: 3,
        b: 2,
        c: 4,
      };

      // WHEN
      const sortedObject = sortKeysByValue(unsortedObject);

      // THEN
      expect(sortedObject).toStrictEqual({
        b: 2,
        a: 3,
        c: 4,
      });
    });
  });
  describe("getPercentage", () => {
    it("should return < 1% if percentage is below 1", () => {
      // GIVEN
      const partialValue = 1;
      const totalValue = 300;

      // WHEN
      const percentage = getPercentage(partialValue, totalValue);

      // THEN
      expect(percentage).toBe("< 1%");
    });
    it("should return correct percentage if percentage is more than 1", () => {
      // GIVEN
      const partialValue = 100;
      const totalValue = 300;

      // WHEN
      const percentage = getPercentage(partialValue, totalValue);

      // THEN
      expect(percentage).toBe("33%");
    });
  });
  describe("computeAverage", () => {
    it("should return 0 when given an empty array", () => {
      // GIVEN
      const array: number[] = [];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(0);
    });
    it("should return the average when given a correct array of numbers", () => {
      // GIVEN
      const array = [3, 8, 5, 1, 0];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(3.4);
    });
    it("should return the average when given an array of null and numbers", () => {
      // GIVEN
      const array = [3, 8, 5, 1, 0, null, null];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(3.4);
    });
  });
  describe("reverseObjectKeyValues", () => {
    it("should return an empty object when given an empty object", () => {
      // GIVEN
      const objectToReverse = {};

      // WHEN
      const reversed = reverseObjectKeyValues(objectToReverse);

      // THEN
      expect(reversed).toStrictEqual({});
    });

    it("should reverse keys and values for a simple object", () => {
      // GIVEN
      const objectToReverse = {
        a: 1,
        b: 2,
        c: 3,
      };

      // WHEN
      const reversed = reverseObjectKeyValues(objectToReverse);

      // THEN
      expect(reversed).toStrictEqual({
        1: "a",
        2: "b",
        3: "c",
      });
    });

    it("should handle string and number keys and values", () => {
      // GIVEN
      const objectToReverse = {
        42: "answer",
        foo: 100,
      };

      // WHEN
      const reversed = reverseObjectKeyValues(objectToReverse);

      // THEN
      expect(reversed).toStrictEqual({
        answer: "42",
        100: "foo",
      });
    });

    it("should overwrite keys if values are not unique", () => {
      // GIVEN
      const objectToReverse = {
        a: 1,
        b: 2,
        c: 1,
      };

      // WHEN
      const reversed = reverseObjectKeyValues(objectToReverse);

      // THEN
      expect(reversed).toStrictEqual({
        1: "c",
        2: "b",
      });
    });
  });

  describe("convertObjectToArray", () => {
    it("should return an empty array when given an empty object", () => {
      // GIVEN
      const objectToConvert = {};

      // WHEN
      const result = convertObjectToArray(objectToConvert);

      // THEN
      expect(result).toStrictEqual([]);
    });

    it("should convert values of a simple object to array", () => {
      // GIVEN
      const objectToConvert = {
        a: 1,
        b: 2,
        c: 3,
      };

      // WHEN
      const result = convertObjectToArray(objectToConvert);

      // THEN
      expect(result).toStrictEqual([1, 2, 3]);
    });

    it("should work with number keys", () => {
      // GIVEN
      const objectToConvert = {
        1: "one",
        2: "two",
        3: "three",
      };

      // WHEN
      const result = convertObjectToArray(objectToConvert);

      // THEN
      expect(result).toStrictEqual(["one", "two", "three"]);
    });
  });

  describe("isNullOrUndefined", () => {
    it("should return true if value is undefined", () => {
      // GIVEN
      const value = undefined;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(true);
    });
    it("should return true if value is null", () => {
      // GIVEN
      const value = null;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(true);
    });
    it("should return false if value is 0", () => {
      // GIVEN
      const value = 0;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(false);
    });

    it("should return false if value is an emptys string", () => {
      // GIVEN
      const value = "";

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(false);
    });
  });
});
