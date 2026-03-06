import { AllowedUser } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const getAllowedUserPatterns = async (): Promise<
  { emailPattern: string }[]
> => {
  return prisma.allowedUser.findMany({
    select: { emailPattern: true },
  });
};

export const getAllAllowedUsers = async (): Promise<AllowedUser[]> => {
  return prisma.allowedUser.findMany();
};
