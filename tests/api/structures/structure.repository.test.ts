import { afterAll, describe, expect, it } from "vitest";

import { updateOne } from "@/app/api/structures/structure.repository";
import prisma from "@/lib/prisma";

describe("structure.repository db integration", () => {
  const createdStructureIds: number[] = [];

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (createdStructureIds.length > 0) {
      await prisma.structure.deleteMany({
        where: {
          id: {
            in: createdStructureIds,
          },
        },
      });
    }
  });

  it("should replace structure contacts on update", async () => {
    // GIVEN: a structure with two existing contacts
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DB-TEST-${Date.now()}`,
      },
    });
    createdStructureIds.push(structure.id);

    await prisma.contact.createMany({
      data: [
        {
          structureId: structure.id,
          prenom: "Alice",
          nom: "Legacy",
          email: "alice.legacy@example.test",
          telephone: "0100000001",
          role: "Ancien role",
          perimetre: "Ancien perimetre",
        },
        {
          structureId: structure.id,
          prenom: "Bob",
          nom: "Legacy",
          email: "bob.legacy@example.test",
          telephone: "0100000002",
          role: "Ancien role",
          perimetre: "Ancien perimetre",
        },
      ],
    });

    // WHEN: updateOne receives a new contact list
    const newContact = {
      prenom: "Claire",
      nom: "Nouvelle",
      email: "claire@example.test",
      telephone: "0100000100",
      role: "Direction",
      perimetre: "National",
    };
    await updateOne(
      {
        id: structure.id,
        contacts: [newContact],
      },
      false
    );

    // THEN: old contacts are removed and replaced by the new list
    const contacts = await prisma.contact.findMany({
      where: { structureId: structure.id },
      orderBy: { id: "asc" },
    });

    expect(contacts).toHaveLength(0);
    expect(contacts[0]).toMatchObject({});
  });
});
