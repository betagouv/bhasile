import { fakerFR as faker } from "@faker-js/faker";

import { Contact, ContactType } from "@/generated/prisma/client";

export const createFakeContact = (
  type: ContactType
): Omit<Contact, "id" | "structureDnaCode"> => {
  const prenom = faker.person.firstName();
  const nom = faker.person.lastName();

  return {
    prenom,
    nom,
    telephone: faker.phone.number(),
    email: faker.internet.email({ firstName: prenom, lastName: nom }),
    role: faker.helpers.arrayElement(["Directeur", "Contact"]),
    type,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
