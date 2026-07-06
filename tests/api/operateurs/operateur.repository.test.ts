import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findAllOperateurs } from "@/app/api/operateurs/operateur.repository";
import prisma from "@/lib/prisma";

describe("operateur.repository db integration", () => {
  let operateurId: number | undefined;
  let logoId: number | undefined;
  let logoKey: string | undefined;

  beforeAll(async () => {
    logoKey = `op-test-${randomUUID()}`;
    const operateur = await prisma.operateur.create({
      data: {
        name: `OP-TEST-${randomUUID()}`,
        logo: {
          create: {
            key: logoKey,
            mimeType: "image/png",
            fileSize: 1,
            originalName: "logo.png",
          },
        },
      },
      select: { id: true, logo: { select: { id: true } } },
    });
    operateurId = operateur.id;
    logoId = operateur.logo?.id;
  });

  afterAll(async () => {
    if (logoId) {
      await prisma.fileUpload.deleteMany({ where: { id: logoId } });
    }
    if (operateurId) {
      await prisma.operateur.deleteMany({ where: { id: operateurId } });
    }
  });

  it("findAllOperateurs renvoie les opérateurs avec parentId et la clé de leur logo", async () => {
    const operateurs = await findAllOperateurs();
    const operateur = operateurs.find(
      (candidate) => candidate.id === operateurId
    );

    expect(operateur).toBeDefined();
    expect(operateur?.name).toContain("OP-TEST-");
    expect(operateur?.parentId).toBeNull();
    expect(operateur?.logo?.key).toBe(logoKey);
  });
});
