import { EmailPattern } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const getEmailPatterns = async (): Promise<EmailPattern[]> => {
  return prisma.emailPattern.findMany({});
};
