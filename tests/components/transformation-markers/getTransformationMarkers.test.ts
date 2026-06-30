import { describe, expect, it } from "vitest";

import { getTransformationMarkers } from "@/app/components/transformation-markers/getTransformationMarkers";
import { HistoryEvent } from "@/types/structure-history.type";

const years = [2021, 2022, 2023, 2024, 2025, 2026];

const extension = (date: string): HistoryEvent => ({
  kind: "EXTENSION",
  date,
  sources: [],
});
const contraction = (date: string): HistoryEvent => ({
  kind: "CONTRACTION",
  date,
  targets: [],
});

describe("getTransformationMarkers", () => {
  it("renvoie [] pour une entrée absente ou vide", () => {
    expect(getTransformationMarkers(undefined, years)).toEqual([]);
    expect(getTransformationMarkers([], years)).toEqual([]);
    expect(getTransformationMarkers([extension("2023-05-01")], [])).toEqual([]);
  });

  it("ne conserve que les événements d'extension et de contraction", () => {
    const history: HistoryEvent[] = [
      extension("2023-05-01"),
      { kind: "CREATION", date: "2023-06-01", sources: [] },
      { kind: "FERMETURE", date: "2023-07-01", targets: [], motif: null },
      {
        kind: "CPOM_ENTRY",
        date: "2023-08-01",
        cpom: { id: 1, operateurName: "X", departements: [] },
      },
    ];

    const markers = getTransformationMarkers(history, years);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ year: 2023, badge: "EXTENSION" });
    expect(markers[0].events).toHaveLength(1);
  });

  it("écarte la première année affichée et les années hors plage", () => {
    const history = [
      extension("2021-03-01"), // first displayed year -> skip
      extension("2019-03-01"), // before range -> skip
      extension("2030-03-01"), // after range -> skip
      extension("2024-03-01"), // kept
    ];

    const markers = getTransformationMarkers(history, years);
    expect(markers.map((marker) => marker.year)).toEqual([2024]);
  });

  it("regroupe les événements d'une même année, les trie par ordre croissant et marque MIXED", () => {
    const history = [contraction("2023-09-15"), extension("2023-02-10")];

    const markers = getTransformationMarkers(history, years);
    expect(markers).toHaveLength(1);
    expect(markers[0].badge).toBe("MIXED");
    expect(markers[0].events.map((event) => event.date)).toEqual([
      "2023-02-10",
      "2023-09-15",
    ]);
  });

  it("renvoie les marqueurs ordonnés par année", () => {
    const markers = getTransformationMarkers(
      [extension("2025-01-01"), contraction("2022-01-01")],
      years
    );
    expect(markers.map((marker) => marker.year)).toEqual([2022, 2025]);
  });
});
