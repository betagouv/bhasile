import {
  areAllValuesEmpty,
  areCodesUnique,
  computeAverage,
  convertObjectToArray,
  getPercentage,
  isEmptyValue,
  isNullOrUndefined,
  reverseObjectKeyValues,
  sortKeysByValue,
} from "@/app/utils/common.util";

describe("common util", () => {
  describe("isEmptyValue", () => {
    it.each([undefined, null, "", []])(
      "retourne true pour %s",
      (value) => {
        expect(isEmptyValue(value)).toStrictEqual(true);
      }
    );

    it.each(["text", 0, 42, false, ["item"]])(
      "retourne false pour %s",
      (value) => {
        expect(isEmptyValue(value)).toStrictEqual(false);
      }
    );
  });

  describe("areAllValuesEmpty", () => {
    it("retourne true quand toutes les valeurs sont vides", () => {
      expect(
        areAllValuesEmpty({ prenom: "", nom: "", telephone: "" })
      ).toStrictEqual(true);
    });

    it("retourne true pour un objet sans valeurs", () => {
      expect(areAllValuesEmpty({})).toStrictEqual(true);
    });

    it("retourne false quand au moins une valeur est renseignée", () => {
      expect(
        areAllValuesEmpty({ prenom: "Jean", nom: "", telephone: "" })
      ).toStrictEqual(false);
    });

    it("retourne false quand seul un id est présent", () => {
      expect(areAllValuesEmpty({ id: 42, prenom: "", nom: "" })).toStrictEqual(
        false
      );
    });
  });

  describe("sortKeysByValue", () => {
    it("retourne un objet vide quand on passe un objet vide", () => {
      // GIVEN
      const unsortedObject = {};

      // WHEN
      const sortedObject = sortKeysByValue(unsortedObject);

      // THEN
      expect(sortedObject).toStrictEqual({});
    });
    it("retourne un objet trié par valeur quand on passe un objet non trié", () => {
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
    it("retourne < 1% quand le pourcentage est inférieur à 1", () => {
      // GIVEN
      const partialValue = 1;
      const totalValue = 300;

      // WHEN
      const percentage = getPercentage(partialValue, totalValue);

      // THEN
      expect(percentage).toBe("< 1%");
    });
    it("retourne le bon pourcentage quand il est supérieur à 1", () => {
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
    it("retourne 0 quand on passe un tableau vide", () => {
      // GIVEN
      const array: number[] = [];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(0);
    });
    it("retourne la moyenne quand on passe un tableau de nombres valides", () => {
      // GIVEN
      const array = [3, 8, 5, 1, 0];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(3.4);
    });
    it("retourne la moyenne quand on passe un tableau mêlant null et nombres", () => {
      // GIVEN
      const array = [3, 8, 5, 1, 0, null, null];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(3.4);
    });
    it("retourne 0 quand on passe un tableau composé uniquement de null", () => {
      // GIVEN
      const array = [null, null, null, null];

      // WHEN
      const result = computeAverage(array);

      // THEN
      expect(result).toBe(0);
    });
  });
  describe("reverseObjectKeyValues", () => {
    it("retourne un objet vide quand on passe un objet vide", () => {
      // GIVEN
      const objectToReverse = {};

      // WHEN
      const reversed = reverseObjectKeyValues(objectToReverse);

      // THEN
      expect(reversed).toStrictEqual({});
    });

    it("inverse les clés et les valeurs d'un objet simple", () => {
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

    it("gère les clés et valeurs de type chaîne et nombre", () => {
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

    it("écrase les clés quand les valeurs ne sont pas uniques", () => {
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
    it("retourne un tableau vide quand on passe un objet vide", () => {
      // GIVEN
      const objectToConvert = {};

      // WHEN
      const result = convertObjectToArray(objectToConvert);

      // THEN
      expect(result).toStrictEqual([]);
    });

    it("convertit les valeurs d'un objet simple en tableau", () => {
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

    it("fonctionne avec des clés numériques", () => {
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
    it("retourne true quand la valeur est undefined", () => {
      // GIVEN
      const value = undefined;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(true);
    });
    it("retourne true quand la valeur est null", () => {
      // GIVEN
      const value = null;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(true);
    });
    it("retourne false quand la valeur est 0", () => {
      // GIVEN
      const value = 0;

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(false);
    });

    it("retourne false quand la valeur est une chaîne vide", () => {
      // GIVEN
      const value = "";

      // WHEN
      const result = isNullOrUndefined(value);

      // THEN
      expect(result).toStrictEqual(false);
    });
  });

  describe("areCodesUnique", () => {
    it("retourne true quand tous les codes extraits sont distincts", () => {
      // GIVEN
      const items = [{ code: "C-001" }, { code: "H-002" }];

      // WHEN
      const result = areCodesUnique(items, (item) => item.code);

      // THEN
      expect(result).toStrictEqual(true);
    });

    it("retourne false quand deux codes extraits sont égaux", () => {
      // GIVEN
      const items = [{ code: "C-001" }, { code: "C-001" }];

      // WHEN
      const result = areCodesUnique(items, (item) => item.code);

      // THEN
      expect(result).toStrictEqual(false);
    });

    it("considère comme égaux des codes qui ne diffèrent que par des espaces", () => {
      // GIVEN
      const items = [{ code: "C-001" }, { code: "  C-001  " }];

      // WHEN
      const result = areCodesUnique(items, (item) => item.code);

      // THEN
      expect(result).toStrictEqual(false);
    });

    it("ignore les codes vides, null et undefined", () => {
      // GIVEN
      const items = [
        { code: "C-001" },
        { code: "" },
        { code: "   " },
        { code: null },
        { code: undefined },
      ];

      // WHEN
      const result = areCodesUnique(items, (item) => item.code);

      // THEN
      expect(result).toStrictEqual(true);
    });

    it("retourne true pour un tableau vide", () => {
      // GIVEN
      const items: { code: string }[] = [];

      // WHEN
      const result = areCodesUnique(items, (item) => item.code);

      // THEN
      expect(result).toStrictEqual(true);
    });

    it("retourne true quand la liste d'éléments est undefined", () => {
      // WHEN
      const result = areCodesUnique(
        undefined,
        (item: { code: string }) => item.code
      );

      // THEN
      expect(result).toStrictEqual(true);
    });

    it("fonctionne avec n'importe quelle forme d'élément grâce à l'extracteur", () => {
      // GIVEN
      const items = [{ siret: "111" }, { siret: "222" }, { siret: "111" }];

      // WHEN
      const result = areCodesUnique(items, (item) => item.siret);

      // THEN
      expect(result).toStrictEqual(false);
    });
  });
});
