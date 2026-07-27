import { describe, expect, it } from "vitest";

import { getIndicateursFinanciersSchema } from "@/schemas/forms/base/indicateurFinancier.schema";

const rempli = (year: number, type: "REALISE" | "PREVISIONNEL") => ({
  year,
  type,
  ETP: 1,
  tauxEncadrement: 1,
  coutJournalier: 1,
});

const vide = (year: number, type: "REALISE" | "PREVISIONNEL") => ({
  year,
  type,
});

describe("getIndicateursFinanciersSchema", () => {
  const schema = getIndicateursFinanciersSchema(2024);

  it("rejette une liste vide", () => {
    const result = schema.safeParse({ indicateursFinanciers: [] });

    expect(result.success).toBe(false);
  });

  it("exige le réalisé pour une année jusqu'au cutoff inclus", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [vide(2024, "REALISE")],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("réalisé 2024");
    expect(result.error?.issues[0]?.message).toContain("obligatoire");
  });

  it("refuse le prévisionnel seul pour une année jusqu'au cutoff", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [rempli(2024, "PREVISIONNEL")],
    });

    expect(result.success).toBe(false);
  });

  it("accepte le réalisé pour une année jusqu'au cutoff", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [rempli(2024, "REALISE")],
    });

    expect(result.success).toBe(true);
  });

  it("accepte le prévisionnel seul après le cutoff", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [
        rempli(2024, "REALISE"),
        rempli(2025, "PREVISIONNEL"),
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepte le réalisé seul après le cutoff", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [rempli(2024, "REALISE"), rempli(2025, "REALISE")],
    });

    expect(result.success).toBe(true);
  });

  it("refuse une année après le cutoff sans réalisé ni prévisionnel", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [
        rempli(2024, "REALISE"),
        vide(2025, "PREVISIONNEL"),
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("2025");
  });

  it("émet un message distinct par année fautive", () => {
    const result = getIndicateursFinanciersSchema(2025).safeParse({
      indicateursFinanciers: [vide(2024, "REALISE"), vide(2025, "REALISE")],
    });

    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message) ?? [];
    expect(messages).toHaveLength(2);
    expect(messages.some((message) => message.includes("2024"))).toBe(true);
    expect(messages.some((message) => message.includes("2025"))).toBe(true);
  });

  it("cible le path sur l'année fautive pour l'affichage", () => {
    const result = schema.safeParse({
      indicateursFinanciers: [vide(2024, "REALISE")],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain(2024);
  });
});
