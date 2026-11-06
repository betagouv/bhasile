import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findUsersWithGrantsOnStructure } from "@/app/api/users/user.repository";
import { AccessRole, GrantScope } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("findUsersWithGrantsOnStructure", () => {
  const testId = randomUUID();
  let structureId: number;
  let patternUserId: number;
  let structureUserId: number;
  let otherDepartementUserId: number;
  let emailPatternId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-USER-TEST-${testId}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    const emailPattern = await prisma.emailPattern.create({
      data: {
        pattern: `@manche-${testId}.gouv.fr`,
        isAgent: true,
        grants: {
          create: {
            role: AccessRole.EDITEUR,
            scope: GrantScope.DEPARTEMENT,
            departementNumero: "50",
          },
        },
      },
    });
    emailPatternId = emailPattern.id;
    const patternUser = await prisma.user.create({
      data: { email: `pattern-${testId}@manche.gouv.fr`, emailPatternId },
    });
    patternUserId = patternUser.id;
    const structureUser = await prisma.user.create({
      data: {
        email: `structure-${testId}@test.fr`,
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
        email: `calvados-${testId}@test.fr`,
        grants: {
          create: {
            role: AccessRole.EDITEUR,
            scope: GrantScope.DEPARTEMENT,
            departementNumero: "14",
          },
        },
      },
    });
    otherDepartementUserId = otherDepartementUser.id;
  });

  afterAll(async () => {
    const userIds = [patternUserId, structureUserId, otherDepartementUserId];
    await prisma.grant.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { emailPatternId }] },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.emailPattern.delete({ where: { id: emailPatternId } });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.$disconnect();
  });

  it("renvoie les utilisateurs dont un grant personnel ou de pattern porte sur le département ou la structure", async () => {
    const users = await findUsersWithGrantsOnStructure({
      structureId,
      departementNumero: "50",
    });
    const userIds = users.map((user) => user.id);

    expect(userIds).toContain(patternUserId);
    expect(userIds).toContain(structureUserId);
    expect(userIds).not.toContain(otherDepartementUserId);
  });
});
