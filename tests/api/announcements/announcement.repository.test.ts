import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findActiveAnnouncements } from "@/app/api/announcements/announcement.repository";
import prisma from "@/lib/prisma";

describe("announcement.repository db integration", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  const createdIds: number[] = [];

  const createAnnouncement = async (data: {
    content: string;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
  }): Promise<number> => {
    const announcement = await prisma.announcement.create({ data });
    createdIds.push(announcement.id);
    return announcement.id;
  };

  let activeId = 0;
  let permanentId = 0;
  let boundaryId = 0;
  let expiredId = 0;
  let futureId = 0;

  beforeAll(async () => {
    activeId = await createAnnouncement({
      content: "active",
      startDate: new Date(now.getTime() - day),
      endDate: new Date(now.getTime() + day),
      createdAt: new Date(now.getTime() - day),
    });
    permanentId = await createAnnouncement({
      content: "permanent",
      startDate: null,
      endDate: null,
      createdAt: new Date(now.getTime() - 2 * day),
    });
    boundaryId = await createAnnouncement({
      content: "boundary",
      startDate: null,
      endDate: now,
      createdAt: new Date(now.getTime() - 3 * day),
    });
    expiredId = await createAnnouncement({
      content: "expired",
      startDate: new Date(now.getTime() - 10 * day),
      endDate: new Date(now.getTime() - day),
      createdAt: new Date(now.getTime() - 10 * day),
    });
    futureId = await createAnnouncement({
      content: "future",
      startDate: new Date(now.getTime() + day),
      endDate: null,
      createdAt: now,
    });
  });

  afterAll(async () => {
    await prisma.announcement.deleteMany({ where: { id: { in: createdIds } } });
  });

  it("retourne les annonces actives, permanentes et à la borne de fin incluse", async () => {
    const results = await findActiveAnnouncements(now);
    const ids = results.map((announcement) => announcement.id);

    expect(ids).toContain(activeId);
    expect(ids).toContain(permanentId);
    expect(ids).toContain(boundaryId);
  });

  it("exclut les annonces expirées et futures", async () => {
    const results = await findActiveAnnouncements(now);
    const ids = results.map((announcement) => announcement.id);

    expect(ids).not.toContain(expiredId);
    expect(ids).not.toContain(futureId);
  });

  it("trie par createdAt puis id décroissants", async () => {
    const results = await findActiveAnnouncements(now);
    const mineOrdered = results
      .map((announcement) => announcement.id)
      .filter((id) => createdIds.includes(id));

    expect(mineOrdered).toEqual([activeId, permanentId, boundaryId]);
  });
});
