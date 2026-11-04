import { PrismaClient, StructureType, Visibility } from "@/generated/prisma/client";

export const createFakeConversations = async (
  prisma: PrismaClient,
  campaignYear: number
): Promise<void> => {
  const structures = await prisma.structure.findMany({
    where: {
      departementAdministratif: "75",
      type: { in: [StructureType.CADA, StructureType.CPH] },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  console.log(
    `   Structures avec conversations : ${structures.map((structure) => structure.id).join(", ")}`
  );
  const campaign = await prisma.tarificationCampaign.create({
    data: { year: campaignYear },
  });

  for (const structure of structures) {
    const tarification = await prisma.structureTarification.create({
      data: { structureId: structure.id, campaignId: campaign.id },
    });
    await prisma.conversation.createMany({
      data: [Visibility.SHARED, Visibility.AGENTS].map((visibility) => ({
        structureTarificationId: tarification.id,
        visibility,
      })),
    });
  }

  console.log(
    `✅ ${structures.length} tarifications ${campaignYear} et leurs conversations créées`
  );
};
