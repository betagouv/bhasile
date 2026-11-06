import prisma from "@/lib/prisma";

export const findRegionIdByName = async (
  name: string
): Promise<number | undefined> => {
  const region = await prisma.region.findFirst({
    where: { name },
    select: { id: true },
  });
  return region?.id;
};
