import prisma from "@/lib/prisma";

export const getFaqItems = async () => {
  const faqItems = await prisma.faq.findMany();
  return { faqItems };
};
