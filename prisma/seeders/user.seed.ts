import { PrismaClient } from "@/generated/prisma/client";

export const upsertBhasileUser = async (
  prisma: PrismaClient
): Promise<{ id: number }> => {
  return prisma.user.upsert({
    where: { email: "bhasile@bhasile.local" },
    update: { name: "Bhasile", lastConnection: new Date() },
    create: {
      name: "Bhasile",
      email: "bhasile@bhasile.local",
      lastConnection: new Date(),
    },
    select: { id: true },
  });
};

