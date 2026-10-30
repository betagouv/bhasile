import { describe, expect, it } from "vitest";

import {
  addDays,
  getDepartementTimeZone,
  toCivilDate,
  toLocalDate,
} from "@/lib/tarification/tarification.date";

const PARIS = "Europe/Paris";

describe("toLocalDate", () => {
  it("passe au lendemain à minuit heure de Paris en hiver", () => {
    expect(toLocalDate(new Date("2027-12-31T22:59:59Z"), PARIS)).toBe(
      "2027-12-31"
    );
    expect(toLocalDate(new Date("2027-12-31T23:00:00Z"), PARIS)).toBe(
      "2028-01-01"
    );
  });

  it("passe au lendemain à minuit heure de Paris en été", () => {
    expect(toLocalDate(new Date("2027-07-01T21:59:59Z"), PARIS)).toBe(
      "2027-07-01"
    );
    expect(toLocalDate(new Date("2027-07-01T22:00:00Z"), PARIS)).toBe(
      "2027-07-02"
    );
  });

  it("reste sur le bon jour le jour du changement d'heure d'octobre", () => {
    expect(toLocalDate(new Date("2027-10-31T00:30:00Z"), PARIS)).toBe(
      "2027-10-31"
    );
    expect(toLocalDate(new Date("2027-10-31T22:59:59Z"), PARIS)).toBe(
      "2027-10-31"
    );
  });

  it("passe au lendemain à minuit heure locale outre-mer", () => {
    expect(
      toLocalDate(new Date("2027-04-30T20:00:00Z"), "Indian/Reunion")
    ).toBe("2027-05-01");
    expect(
      toLocalDate(new Date("2027-05-01T03:59:59Z"), "America/Guadeloupe")
    ).toBe("2027-04-30");
  });
});

describe("getDepartementTimeZone", () => {
  it("donne leur fuseau aux départements d'outre-mer, Paris aux autres", () => {
    expect(getDepartementTimeZone("974")).toBe("Indian/Reunion");
    expect(getDepartementTimeZone("973")).toBe("America/Cayenne");
    expect(getDepartementTimeZone("2A")).toBe(PARIS);
  });
});

describe("toCivilDate", () => {
  it("lit une colonne date telle quelle, sans décalage horaire", () => {
    expect(toCivilDate(new Date("2028-03-01T00:00:00Z"))).toBe("2028-03-01");
  });
});

describe("addDays", () => {
  it("franchit les fins de mois et d'année", () => {
    expect(addDays("2028-03-01", 48)).toBe("2028-04-18");
    expect(addDays("2027-12-25", 8)).toBe("2028-01-02");
  });

  it("compte le 29 février d'une année bissextile", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
