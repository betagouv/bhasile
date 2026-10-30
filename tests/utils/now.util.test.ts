import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentYear } from "@/app/utils/now.util";

describe("getCurrentYear", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("suit l'horloge sans rechargement du module", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:59:00Z"));
    expect(getCurrentYear()).toBe(2026);

    vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
    expect(getCurrentYear()).toBe(2027);
  });

  it("calcule l'année en UTC, indépendamment du fuseau local", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T00:30:00+01:00"));
    expect(getCurrentYear()).toBe(2026);
  });
});
