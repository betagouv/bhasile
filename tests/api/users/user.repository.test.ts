import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findUsersWithGrantsOnStructure } from "@/app/api/users/user.repository";
import { AccessRole, GrantScope } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("user repository", () => {
  const testId = randomUUID();
  let structureId: number;
  let perimeterIds: number[];
  let perimeterUserId: number;
  let deactivatedUserId: number;
  let structureUserId: number;
  let otherDepartementUserId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-USER-TEST-${testId}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    const [manche, calvados] = await Promise.all(
      ["50", "14"].map((departementNumero) =>
        prisma.perimeter.create({
          data: {
            name: `DDETS ${departementNumero} ${testId}`,
            scope: GrantScope.DEPARTEMENT,
            departementNumero,
          },
        })
      )
    );
    perimeterIds = [manche.id, calvados.id];
    const perimeterUser = await prisma.user.create({
      data: {
        email: `perimeter-${testId}@manche.gouv.fr`,
        perimeterId: manche.id,
        isActivated: true,
      },
    });
    perimeterUserId = perimeterUser.id;
    const deactivatedUser = await prisma.user.create({
      data: {
        email: `deactivated-${testId}@manche.gouv.fr`,
        perimeterId: manche.id,
        isActivated: false,
        deactivatedAt: new Date(),
      },
    });
    deactivatedUserId = deactivatedUser.id;
    const structureUser = await prisma.user.create({
      data: {
        email: `structure-${testId}@test.fr`,
        isActivated: true,
        grants: {
          create: {
            role: AccessRole.EDITEUR,
            scope: GrantScope.STRUCTURE,
            structureId,
          },
        },
      },
    });
    structureUserId = structureUser.id;
    const otherDepartementUser = await prisma.user.create({
      data: {
        email: `calvados-${testId}@calvados.gouv.fr`,
        perimeterId: calvados.id,
        isActivated: true,
      },
    });
    otherDepartementUserId = otherDepartementUser.id;
  });

  afterAll(async () => {
    const userIds = [
      perimeterUserId,
      deactivatedUserId,
      structureUserId,
      otherDepartementUserId,
    ];
    await prisma.grant.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.perimeter.deleteMany({ where: { id: { in: perimeterIds } } });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.$disconnect();
  });

  it("renvoie les utilisateurs activés dont le périmètre ou un binôme porte sur le département ou la structure", async () => {
    const users = await findUsersWithGrantsOnStructure({
      structureId,
      departementNumero: "50",
    });
    const userIds = users.map((user) => user.id);

    expect(userIds).toContain(perimeterUserId);
    expect(userIds).toContain(structureUserId);
    expect(userIds).not.toContain(deactivatedUserId);
    expect(userIds).not.toContain(otherDepartementUserId);
  });
});
