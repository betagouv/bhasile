import { describe, expect, it } from "vitest";

import {
  buildCommuneKey,
  normalizeLocalisation,
} from "@/app/api/adresses/adresse.util";

describe("normalizeLocalisation", () => {
  it("rogne la commune et le code postal", () => {
    expect(
      normalizeLocalisation({ codePostal: " 50000 ", commune: " Saint-Lô " })
    ).toEqual({ codePostal: "50000", commune: "Saint-Lô" });
  });

  it("retire les espaces internes d'un code postal formaté", () => {
    expect(
      normalizeLocalisation({ codePostal: "75 011", commune: "Paris" })
    ).toEqual({ codePostal: "75011", commune: "Paris" });
    expect(
      normalizeLocalisation({ codePostal: "75\u00a0011", commune: "Paris" })
    ).toEqual({ codePostal: "75011", commune: "Paris" });
  });

  it("rétablit le zéro initial qu'Excel supprime", () => {
    expect(
      normalizeLocalisation({ codePostal: "1000", commune: "Bourg-en-Bresse" })
    ).toEqual({ codePostal: "01000", commune: "Bourg-en-Bresse" });
  });

  it("rend null sans commune ou avec un code postal inexploitable", () => {
    expect(
      normalizeLocalisation({ codePostal: "50000", commune: " " })
    ).toBeNull();
    expect(
      normalizeLocalisation({ codePostal: null, commune: "Saint-Lô" })
    ).toBeNull();
    expect(
      normalizeLocalisation({ codePostal: "500", commune: "Saint-Lô" })
    ).toBeNull();
  });
});

describe("buildCommuneKey", () => {
  it("ignore la casse de la commune", () => {
    expect(buildCommuneKey({ codePostal: "50000", commune: "SAINT-LÔ" })).toBe(
      buildCommuneKey({ codePostal: "50000", commune: "saint-lô" })
    );
  });
});
