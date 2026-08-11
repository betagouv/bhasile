import { describe, expect, it } from "vitest";

import { parseDate } from "@/app/utils/date.util";
import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import {
  ANOMALIE_DEFINITIONS,
  DISPLAYED_ANOMALIE_CODES,
} from "@/lib/anomalies/anomalie.definition";
import { buildFormAnomalieContext } from "@/lib/anomalies/anomalie.form";
import { ANOMALIE_RULES } from "@/lib/anomalies/rules";
import { StructureApiRead } from "@/schemas/api/structure.schema";

const makeStructure = (
  overrides: Partial<StructureApiRead> = {}
): StructureApiRead =>
  ({
    type: "CADA",
    departementAdministratif: "50",
    creationDate: "2020-01-01T12:00:00.000Z",
    date303: null,
    placesAutorisees: 100,
    lgbt: true,
    fvvTeh: false,
    debutConvention: "2021-01-01T12:00:00.000Z",
    finConvention: null,
    debutPeriodeAutorisation: null,
    finPeriodeAutorisation: null,
    structureTypologies: [],
    actesAdministratifs: [],
    adresses: [],
    budgets: [],
    indicateursFinanciers: [],
    ...overrides,
  }) as unknown as StructureApiRead;

describe("parseDate", () => {
  it("hydrate une date ISO du payload", () => {
    expect(parseDate("2024-03-15T12:00:00.000Z")).toEqual(
      new Date("2024-03-15T12:00:00.000Z")
    );
  });

  it("hydrate une date saisie au format français", () => {
    expect(parseDate("15/03/2024")).toEqual(
      new Date("2024-03-15T12:00:00.000Z")
    );
  });

  it("laisse passer une Date déjà hydratée", () => {
    const date = new Date("2024-03-15T12:00:00.000Z");

    expect(parseDate(date)).toBe(date);
  });

  it("rend null pour une valeur absente ou illisible", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate("pas une date")).toBeNull();
  });
});

describe("buildFormAnomalieContext", () => {
  it("couvre les tranches requises par chaque code affiché", () => {
    const produites = Object.keys(buildFormAnomalieContext(makeStructure()));
    const requises = DISPLAYED_ANOMALIE_CODES.flatMap(
      (code) =>
        ANOMALIE_RULES.find((rule) => rule.code === code)?.requires ?? []
    );

    expect(requises.filter((slice) => !produites.includes(slice))).toEqual([]);
  });

  it("ne produit pas les tranches dont aucun code affiché n'a besoin", () => {
    const produites = Object.keys(buildFormAnomalieContext(makeStructure()));

    expect(produites).not.toContain("cpoms");
    expect(produites).not.toContain("activites");
  });

  it("hydrate les dates de la structure et des actes", () => {
    const context = buildFormAnomalieContext(
      makeStructure({
        actesAdministratifs: [
          {
            id: 7,
            category: "CONVENTION",
            startDate: "01/01/2022",
            endDate: "2026-12-31T12:00:00.000Z",
          },
        ],
      } as unknown as Partial<StructureApiRead>)
    );

    expect(context.structure?.creationDate).toBeInstanceOf(Date);
    expect(context.actes?.[0].startDate).toEqual(
      new Date("2022-01-01T12:00:00.000Z")
    );
    expect(context.actes?.[0].endDate).toEqual(
      new Date("2026-12-31T12:00:00.000Z")
    );
  });

  it("laisse les valeurs du formulaire écraser celles de la structure", () => {
    const context = buildFormAnomalieContext(makeStructure(), {
      typologies: [
        { year: 2025, placesAutorisees: 10, pmr: 0, lgbt: 99, fvvTeh: 0 },
      ],
    });

    expect(context.typologies).toEqual([
      { year: 2025, placesAutorisees: 10, pmr: 0, lgbt: 99, fvvTeh: 0 },
    ]);
  });

  it("ramène à null un montant que l'agent a vidé", () => {
    const context = buildFormAnomalieContext(
      makeStructure({
        budgets: [{ year: 2025, totalProduits: "", totalCharges: "" }],
      } as unknown as Partial<StructureApiRead>)
    );

    expect(context.budgets?.[0].totalProduits).toBeNull();
    expect(context.budgets?.[0].totalCharges).toBeNull();
  });

  it("ne signale pas un résultat net nul quand les montants sont vidés", () => {
    const { detected } = computeAnomalies(
      buildFormAnomalieContext(
        makeStructure({
          budgets: [{ year: 2025, totalProduits: "", totalCharges: "" }],
        } as unknown as Partial<StructureApiRead>)
      ),
      { currentYear: 2026 }
    );

    expect(detected.map((anomalie) => anomalie.code)).not.toContain(
      "RESULTAT_NET_EQ_0"
    );
  });

  it("n'expose aucun tarif journalier cible, calculé côté serveur uniquement", () => {
    expect(
      buildFormAnomalieContext(makeStructure()).structure?.tarifJournalierCible
    ).toBeNull();
    expect(
      ANOMALIE_DEFINITIONS.COUT_JOURNALIER_GT_TARIF_CIBLE.isDisplayed
    ).toBe(false);
  });
});
