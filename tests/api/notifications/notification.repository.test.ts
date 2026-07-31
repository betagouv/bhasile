import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findActiveNotifications } from "@/app/api/notifications/notification.repository";
import prisma from "@/lib/prisma";

describe("notification.repository db integration", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  const createdIds: number[] = [];

  const createNotification = async (data: {
    content: string;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
  }): Promise<number> => {
    const notification = await prisma.notification.create({ data });
    createdIds.push(notification.id);
    return notification.id;
  };

  let activeId = 0;
  let permanentId = 0;
  let boundaryId = 0;
  let expiredId = 0;
  let futureId = 0;

  beforeAll(async () => {
    activeId = await createNotification({
      content: "active",
      startDate: new Date(now.getTime() - day),
      endDate: new Date(now.getTime() + day),
      createdAt: new Date(now.getTime() - day),
    });
    permanentId = await createNotification({
      content: "permanent",
      startDate: null,
      endDate: null,
      createdAt: new Date(now.getTime() - 2 * day),
    });
    boundaryId = await createNotification({
      content: "boundary",
      startDate: null,
      endDate: now,
      createdAt: new Date(now.getTime() - 3 * day),
    });
    expiredId = await createNotification({
      content: "expired",
      startDate: new Date(now.getTime() - 10 * day),
      endDate: new Date(now.getTime() - day),
      createdAt: new Date(now.getTime() - 10 * day),
    });
    futureId = await createNotification({
      content: "future",
      startDate: new Date(now.getTime() + day),
      endDate: null,
      createdAt: now,
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { id: { in: createdIds } } });
  });

  it("retourne les notifications actives, permanentes et à la borne de fin incluse", async () => {
    const results = await findActiveNotifications(now);
    const ids = results.map((notification) => notification.id);

    expect(ids).toContain(activeId);
    expect(ids).toContain(permanentId);
    expect(ids).toContain(boundaryId);
  });

  it("exclut les notifications expirées et futures", async () => {
    const results = await findActiveNotifications(now);
    const ids = results.map((notification) => notification.id);

    expect(ids).not.toContain(expiredId);
    expect(ids).not.toContain(futureId);
  });

  it("trie par createdAt puis id décroissants", async () => {
    const results = await findActiveNotifications(now);
    const mineOrdered = results
      .map((notification) => notification.id)
      .filter((id) => createdIds.includes(id));

    expect(mineOrdered).toEqual([activeId, permanentId, boundaryId]);
  });
});
