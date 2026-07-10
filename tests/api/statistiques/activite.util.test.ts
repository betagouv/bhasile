import { describe, expect, it } from "vitest";

import { computeActiviteStatistiques } from "@/app/api/statistiques/activite/activite.util";
import type { StatistiqueDbActivite } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestDnaLinks,
  buildTestStatistiquesContext,
} from "./test-helpers";

const activiteRow = (
  partial: Partial<StatistiqueDbActivite> &
    Pick<StatistiqueDbActivite, "id" | "dnaCode" | "date">
): StatistiqueDbActivite => ({
  placesAutorisees: null,
  desinsectisation: null,
  remiseEnEtat: null,
  sousOccupation: null,
  travaux: null,
  placesIndisponibles: null,
  presencesInduesBPI: null,
  presencesInduesDeboutees: null,
  ...partial,
});

describe("activité - agrégés et série mensuelle", () => {
  const allStructures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
    { id: 2, type: StructureType.CAES, departementAdministratif: "75" },
    { id: 3, type: StructureType.CPH, departementAdministratif: "75" },
    { id: 4, type: StructureType.CADA, departementAdministratif: "75" },
  ];

  const dnaLinks = buildTestDnaLinks([
    { structureId: 1, dnaCode: "DNA01" },
    { structureId: 2, dnaCode: "DNA02" },
    { structureId: 3, dnaCode: "DNA03" },
    { structureId: 4, dnaCode: "DNA04" },
  ]);

  it("dans les agrégés, somme uniquement la dernière activité des structures actives du périmètre", () => {
    const structuresInScope = allStructures.slice(0, 3);

    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: structuresInScope,
        allStructures,
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks,
        activites: [
          activiteRow({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-01-10"),
            placesAutorisees: 80,
            placesIndisponibles: 8,
          }),
          activiteRow({
            id: 2,
            dnaCode: "DNA01",
            date: new Date("2025-03-10"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
          }),
          activiteRow({
            id: 3,
            dnaCode: "DNA02",
            date: new Date("2025-02-10"),
            placesAutorisees: 50,
            placesIndisponibles: 5,
          }),
          activiteRow({
            id: 4,
            dnaCode: "DNA04",
            date: new Date("2025-03-10"),
            placesAutorisees: 999,
            placesIndisponibles: 999,
          }),
        ],
      })
    );

    expect(result.summary.placesEnregistreesDna).toBe(150);
    expect(result.summary.placesIndisponibles).toBe(10);
    // placesDisponibles iso : la structure CAES (50 places) sort du périmètre indispo,
    // donc disponibles = enregistrées hors CAES (100) − indisponibles (10).
    expect(result.summary.placesDisponibles).toBe(90);
  });

  it("par mois, calcule les indicateurs et les taux sur les dénominateurs filtrés par type", () => {
    const structuresInScope = allStructures.slice(0, 3);

    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: structuresInScope,
        allStructures,
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks,
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
          structuresInScope.map((structure) => structure.id),
          { periodDates: [new Date("2025-03-15")] }
        ),
        activites: [
          activiteRow({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-03-15"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
            presencesInduesBPI: 5,
            presencesInduesDeboutees: 2,
          }),
          activiteRow({
            id: 2,
            dnaCode: "DNA02",
            date: new Date("2025-03-15"),
            placesAutorisees: 50,
            placesIndisponibles: 20,
            presencesInduesBPI: 4,
            presencesInduesDeboutees: 1,
          }),
          activiteRow({
            id: 3,
            dnaCode: "DNA03",
            date: new Date("2025-03-15"),
            placesAutorisees: 40,
            placesIndisponibles: 4,
            presencesInduesBPI: 2,
            presencesInduesDeboutees: 3,
          }),
        ],
      })
    );

    const march2025 = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );

    expect(march2025).toMatchObject({
      placesEnregistreesDna: 190,
      placesIndisponibles: 14,
      presencesInduesBPI: 5,
      presencesInduesDeboutees: 2,
      presencesInduesTotal: 7,
    });
    // Taux iso calculés en back : indispo 14 / 140 (hors CAES), total 7 / 100 (hors CAES+CPH).
    expect(march2025?.tauxIndisponibilite).toBe(0.1);
    expect(march2025?.tauxPresencesInduesTotal).toBe(0.07);
  });

  it("par mois, n'infère pas de lignes manquantes et les agrégés restent basés sur la dernière déclaration connue", () => {
    const structuresInScope = [allStructures[0]];

    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: structuresInScope,
        allStructures: structuresInScope,
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks: [dnaLinks[0]],
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
          structuresInScope.map((structure) => structure.id),
          { periodDates: [new Date("2025-02-10"), new Date("2025-03-10")] }
        ),
        activites: [
          activiteRow({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-02-10"),
            placesAutorisees: 80,
            placesIndisponibles: 8,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
          activiteRow({
            id: 2,
            dnaCode: "DNA01",
            date: new Date("2025-03-10"),
            placesAutorisees: 100,
            placesIndisponibles: 5,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
        ],
      })
    );

    expect(result.byMonth).toHaveLength(2);
    expect(result.byMonth[0]?.placesIndisponibles).toBe(8);
    expect(result.byMonth[1]?.placesIndisponibles).toBe(5);

    expect(result.summary.placesEnregistreesDna).toBe(100);
    expect(result.summary.placesIndisponibles).toBe(5);
  });

  it("par mois, compte une structure depuis fermée sur les mois où elle était encore active", () => {
    const closedStructure = {
      id: 5,
      type: StructureType.CADA,
      departementAdministratif: "75",
    };
    const closedDnaLinks = buildTestDnaLinks([
      { structureId: 5, dnaCode: "DNA05" },
    ]);

    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: [], // fermée : absente du périmètre "actif maintenant"
        allStructures: [closedStructure],
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks: closedDnaLinks,
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([5], {
          periodDates: [new Date("2025-01-10")],
        }),
        activites: [
          activiteRow({
            id: 1,
            dnaCode: "DNA05",
            date: new Date("2025-01-10"),
            placesAutorisees: 30,
            placesIndisponibles: 3,
          }),
        ],
      })
    );

    expect(result.summary.placesEnregistreesDna).toBe(0);
    expect(result.byMonth).toHaveLength(1);
    expect(result.byMonth[0]?.placesEnregistreesDna).toBe(30);
    expect(result.byMonth[0]?.placesIndisponibles).toBe(3);
  });
});
