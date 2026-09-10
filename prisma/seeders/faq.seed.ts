import { fakerFR as faker } from "@faker-js/faker";

import { Faq } from "@/generated/prisma/client";

export const createFakeFaqItem = (): Omit<Faq, "id"> => {
  const createdAt = faker.date.past();
  const question =
    faker.helpers.maybe(() => faker.lorem.sentences(2), { probability: 0.5 }) ??
    faker.lorem.sentence();

  return {
    question,
    contentMarkdown: `**${faker.lorem.sentence()}**\n\n${faker.lorem.paragraphs(2, "\n\n")}\n\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
};
