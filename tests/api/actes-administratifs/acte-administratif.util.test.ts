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

  it("returns null dates when no acte matches category", () => {
    const actesAdministratifs: ActeAdministratifStub[] = [];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([null, null]);
  });

  it("ignores non-current actes and keeps the current one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const actesAdministratifs: ActeAdministratifStub[] = [
      {
        category: "CONVENTION",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T00:00:00.000Z"),
      },
      {
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2025-12-31T00:00:00.000Z"),
      },
      {
        category: "CONVENTION",
        startDate: new Date("2025-06-01T00:00:00.000Z"),
        endDate: new Date("2026-06-01T00:00:00.000Z"),
      },
    ];

    expect(
      getDatesOfCurrentActeAdministratif(
        actesAdministratifs as unknown as ActesAdministratifsInput,
        "CONVENTION"
      )
    ).toEqual([
      new Date("2025-06-01T00:00:00.000Z"),
      new Date("2026-06-01T00:00:00.000Z"),
    ]);
  });

  it("excludes actes without endDate", () => {
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

  it("uses the furthest avenant endDate when available", () => {
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

  it("treats equality with now as non-current boundary", () => {
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
    ).toEqual([null, null]);
  });

  it("ignores orphan avenants with unknown parentId", () => {
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
});
