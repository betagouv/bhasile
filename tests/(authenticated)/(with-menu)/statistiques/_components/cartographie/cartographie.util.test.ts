import { describe, expect, it } from "vitest";

import {
  cleanZoneCode,
  getDepartementNumerosForRegion,
  richRecordToValueRecord,
  zonesToRichRecord,
  zonesToValueRecord,
} from "@/app/(authenticated)/(with-menu)/statistiques/_components/cartographie/cartographie.util";
import { CartographieZoneStat } from "@/schemas/api/statistique-cartographie.schema";

const zone = (
  code: string,
  value: number | null,
  evolution: CartographieZoneStat["evolution"] = null
): CartographieZoneStat => ({ code, name: code, value, evolution });

describe("cleanZoneCode", () => {
  it("retire le préfixe `FR-` des codes région", () => {
    expect(cleanZoneCode("FR-IDF")).toBe("IDF");
  });

  it("laisse un numéro de département inchangé", () => {
    expect(cleanZoneCode("75")).toBe("75");
  });
});

describe("zonesToValueRecord", () => {
  it("indexe les valeurs par code nettoyé", () => {
    const record = zonesToValueRecord([zone("FR-IDF", 42), zone("BRE", 7)]);
    expect(record).toEqual({ IDF: 42, BRE: 7 });
  });

  it("exclut les zones sans valeur au lieu de les compter comme 0", () => {
    const record = zonesToValueRecord([zone("FR-IDF", null), zone("BRE", 7)]);
    expect(record).toEqual({ BRE: 7 });
    expect("IDF" in record).toBe(false);
  });
});

describe("zonesToRichRecord", () => {
  it("conserve valeur, delta et direction pour les zones renseignées", () => {
    const record = zonesToRichRecord([
      zone("FR-BRE", 7, {
        previousValue: 5,
        delta: 2,
        direction: "hausse",
      }),
    ]);
    expect(record).toEqual({
      BRE: { value: 7, delta: 2, direction: "hausse" },
    });
  });

  it("exclut les zones sans valeur", () => {
    const record = zonesToRichRecord([zone("FR-IDF", null)]);
    expect(record).toEqual({});
  });
});

describe("richRecordToValueRecord", () => {
  it("ne garde que les valeurs numériques", () => {
    const record = richRecordToValueRecord({
      IDF: { value: 42, delta: 1, direction: "hausse" },
      BRE: { value: 7 },
    });
    expect(record).toEqual({ IDF: 42, BRE: 7 });
  });
});

describe("getDepartementNumerosForRegion", () => {
  it("retourne les numéros de département d'une région métropolitaine", () => {
    expect(getDepartementNumerosForRegion("BRE").sort()).toEqual([
      "22",
      "29",
      "35",
      "56",
    ]);
  });

  it("retourne un tableau vide pour un code région inconnu", () => {
    expect(getDepartementNumerosForRegion("ZZZ")).toEqual([]);
  });
});
