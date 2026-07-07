import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findActivitesByDnaCodesAndDate } from "@/app/api/activites/activite.repository";
import prisma from "@/lib/prisma";

describe("activite.repository db integration", () => {
  let dnaCode = "";

  beforeAll(async () => {
    dnaCode = `ACT-TEST-${randomUUID()}`;
    await prisma.dna.create({
      data: {
        code: dnaCode,
        activites: {
          create: [
            { date: new Date("2023-06-01T00:00:00.000Z"), placesAutorisees: 10 },
            { date: new Date("2023-12-31T00:00:00.000Z"), placesAutorisees: 20 },
            { date: new Date("2024-06-01T00:00:00.000Z"), placesAutorisees: 99 },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    if (dnaCode) {
      await prisma.dna.deleteMany({ where: { code: dnaCode } });
    }
  });

  it("ne renvoie que les activités du dnaCode dans la plage, borne de fin incluse", async () => {
    const activites = await findActivitesByDnaCodesAndDate(
      [dnaCode],
      new Date("2023-01-01T00:00:00.000Z"),
      new Date("2023-12-31T00:00:00.000Z")
    );

    expect(activites).toHaveLength(2);
    expect(
      activites.map((activite) => activite.placesAutorisees).sort()
    ).toEqual([10, 20]);
  });
});
