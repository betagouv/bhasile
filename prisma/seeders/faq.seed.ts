import { fakerFR as faker } from "@faker-js/faker";

import { Faq } from "@/generated/prisma/client";

const createFakeFaqItem = (category: string): Omit<Faq, "id"> => {
  const createdAt = faker.date.past();
  const question =
    faker.helpers.maybe(() => faker.lorem.sentences(2), { probability: 0.5 }) ??
    faker.lorem.sentence();

  return {
    question,
    contentMarkdown: `**${faker.lorem.sentence()}**\n\n${faker.lorem.paragraphs(2, "\n\n")}\n\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`,
    category,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
};

export const getFakeFaqItems = () => {
  return Array.from({ length: 10 }, () =>
    createFakeFaqItem(
      faker.helpers.arrayElement(["Section 1", "Section 2", "Section 3"])
    )
  );
};
