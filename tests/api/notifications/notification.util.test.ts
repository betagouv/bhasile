import { describe, expect, it } from "vitest";

import { buildActiveWindowWhere } from "@/app/api/notifications/notification.util";

describe("buildActiveWindowWhere", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("inclut les notifications sans date de début (startDate null)", () => {
    const where = buildActiveWindowWhere(now);

    expect(where.AND).toContainEqual({
      OR: [{ startDate: null }, { startDate: { lte: now } }],
    });
  });

  it("inclut les notifications sans date de fin (endDate null)", () => {
    const where = buildActiveWindowWhere(now);

    expect(where.AND).toContainEqual({
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    });
  });

  it("compare les bornes au moment fourni", () => {
    const where = buildActiveWindowWhere(now);

    expect(JSON.stringify(where)).toContain(now.toISOString());
  });
});
