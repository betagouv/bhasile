import { fakerFR as faker } from "@faker-js/faker";

import { Contact } from "@/generated/prisma/client";

export const createFakeContact = (): Omit<
  Contact,
  "id" | "structureDnaCode" | "structureCodeBhasile"
> => {
  const prenom = faker.person.firstName();
  const nom = faker.person.lastName();

  return {
    prenom,
    nom,
    telephone: faker.phone.number().toString(),
    email: faker.internet.email({ firstName: prenom, lastName: nom }),
    role: faker.helpers.arrayElement(["Directeur", "Contact"]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};
