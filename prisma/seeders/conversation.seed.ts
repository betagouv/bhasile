import { fakerFR as faker } from "@faker-js/faker";

import {
  AuthorLevel,
  PrismaClient,
  Visibility,
} from "@/generated/prisma/client";

export const createFakeConversations = async (
  prisma: PrismaClient,
  campaignYear: number
): Promise<void> => {
  const [departementalAgent, regionalAgent] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { email: { startsWith: "departemental@" } },
      select: { id: true },
    }),
    prisma.user.findFirstOrThrow({
      where: { email: { startsWith: "regional@" } },
      select: { id: true },
    }),
  ]);
  const structures = await prisma.structure.findMany({
    where: { departementAdministratif: "75" },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  console.log(
    `   Structures avec échanges : ${structures.map((structure) => structure.id).join(", ")}`
  );
  const campaign = await prisma.tarificationCampaign.create({
    data: { year: campaignYear },
  });

  for (const structure of structures) {
    const tarification = await prisma.structureTarification.create({
      data: { structureId: structure.id, campaignId: campaign.id },
    });
    await prisma.conversation.create({
      data: {
        structureTarificationId: tarification.id,
        visibility: Visibility.SHARED,
        messages: {
          create: [
            {
              authorId: departementalAgent.id,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: faker.lorem.paragraph(),
            },
            {
              authorId: departementalAgent.id,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: faker.lorem.paragraph(),
              tagKey: "RCA",
            },
          ],
        },
      },
    });
    await prisma.conversation.create({
      data: {
        structureTarificationId: tarification.id,
        visibility: Visibility.AGENTS,
        messages: {
          create: [
            {
              authorId: departementalAgent.id,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: faker.lorem.paragraph(),
            },
            {
              authorId: regionalAgent.id,
              authorLevel: AuthorLevel.REGION,
              text: faker.lorem.paragraph(),
            },
          ],
        },
      },
    });
  }

  console.log(
    `✅ ${structures.length} tarifications ${campaignYear} avec leurs échanges créées`
  );
};
