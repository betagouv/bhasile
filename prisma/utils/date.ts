import { fakerFR as faker } from "@faker-js/faker";

export const generateDatePair = (): Date[] => {
  const date1 = faker.date.past({ years: 1 });
  const date2 = faker.date.between({
    from: date1,
    to: faker.date.future({ years: 1 }),
  });
  return [date1, date2];
};
