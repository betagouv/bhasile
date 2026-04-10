import { fakerFR as faker } from "@faker-js/faker";

import { Note, NoteType } from "@/generated/prisma/client";

export const createNotesList = ({
  structures,
  userId,
}: {
  structures: { id: number }[];
  userId: number;
}): Omit<Note, "id">[] => {
  const structuresForNotes = faker.helpers
    .shuffle(structures)
    .slice(0, Math.floor(structures.length / 2));

  return structuresForNotes.flatMap((structure) => {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, () => {
      return {
        structureId: structure.id,
        userId,
        noteType: faker.helpers.enumValue(NoteType),
        note: faker.lorem.paragraphs({ min: 1, max: 2 }),
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
        isArchived:
          faker.helpers.maybe(() => true, { probability: 0.1 }) ?? false,
      };
    });
  });
};
