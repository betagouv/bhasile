import { afterEach, describe, expect, it, vi } from "vitest";

import { getDatesOfCurrentActeAdministratif } from "@/app/api/actes-administratifs/acte-administratif.util";
import { StructureDbList } from "@/app/api/structures/structure.db.type";

type ActeAdministratifStub = {
  id?: number;
  parentId?: number | null;
  category?: "CONVENTION" | "ARRETE_AUTORISATION" | "AUTRE";
  startDate?: Date | null;
  endDate?: Date | null;
};

type ActesAdministratifsInput = StructureDbList["actesAdministratifs"];

describe("acte-administratif util", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retourne des dates nulles quand aucun acte ne correspond à la catégorie", () => {
    const actesAdministratifs: ActeAdministratifStub[] = [];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([null, null]);
  });

  it("ignore les actes non courants et retourne l'acte courant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 101,
        category: "CONVENTION",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
      },
      {
        id: 102,
        category: "CONVENTION",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        endDate: new Date("2024-12-31T00:00:00.000Z"),
      },
      {
        id: 103,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-06-01T00:00:00.000Z"),
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2025-01-01T00:00:00.000Z"),
      new Date("2026-06-01T00:00:00.000Z"),
    ]);
  });

  it("exclut les actes sans endDate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: null,
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([null, null]);
  });

  it("utilise l'endDate de l'avenant le plus lointain quand elle est disponible", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 1,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: 2,
        parentId: 1,
        category: "CONVENTION",
        startDate: new Date("2025-02-01T00:00:00.000Z"),
        endDate: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        id: 3,
        parentId: 1,
        category: "CONVENTION",
        startDate: new Date("2025-03-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
      },
      {
        id: 4,
        parentId: 1,
        category: "CONVENTION",
        startDate: new Date("2025-04-01T00:00:00.000Z"),
        endDate: null,
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2025-01-01T00:00:00.000Z"),
      new Date("2026-12-31T00:00:00.000Z"),
    ]);
  });

  it("traite l'égalité avec now comme une borne courante", () => {
    const now = new Date("2026-01-15T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 11,
        category: "CONVENTION",
        startDate: now,
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: 12,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: now,
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([now, new Date("2026-02-01T00:00:00.000Z")]);
  });

  it("ignore les avenants orphelins dont le parentId est inconnu", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 21,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-03-01T00:00:00.000Z"),
      },
      {
        id: 22,
        parentId: 9999,
        category: "CONVENTION",
        startDate: new Date("2025-02-01T00:00:00.000Z"),
        endDate: new Date("2030-01-01T00:00:00.000Z"),
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2025-01-01T00:00:00.000Z"),
      new Date("2026-03-01T00:00:00.000Z"),
    ]);
  });

  it("se rabat sur l'acte expiré quand aucun n'est actuellement dans l'intervalle", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 31,
        category: "CONVENTION",
        startDate: new Date("2023-01-01T00:00:00.000Z"),
        endDate: new Date("2024-12-31T00:00:00.000Z"),
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2023-01-01T00:00:00.000Z"),
      new Date("2024-12-31T00:00:00.000Z"),
    ]);
  });

  it("se rabat sur l'acte expiré le plus récent quand plusieurs sont expirés", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        id: 41,
        category: "CONVENTION",
        startDate: new Date("2021-01-01T00:00:00.000Z"),
        endDate: new Date("2022-12-31T00:00:00.000Z"),
      },
      {
        id: 42,
        category: "CONVENTION",
        startDate: new Date("2023-01-01T00:00:00.000Z"),
        endDate: new Date("2024-12-31T00:00:00.000Z"),
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2023-01-01T00:00:00.000Z"),
      new Date("2024-12-31T00:00:00.000Z"),
    ]);
  });
});
