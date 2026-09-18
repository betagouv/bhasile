import prisma from "@/lib/prisma";

export const findFaqItems = async () => {
  const faqItems = await prisma.faq.findMany();
  return { faqItems };
};
