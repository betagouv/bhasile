import prisma from "@/lib/prisma";
import { FaqApiWrite } from "@/schemas/api/faq.schema";

export const findFaqItems = async () => {
  const faqItems = await prisma.faq.findMany({
    orderBy: {
      question: "asc",
    },
  });

  return { faqItems };
};

export const findFaqItem = (id: number) =>
  prisma.faq.findUnique({ where: { id }, select: { id: true } });

export const createFaqItem = (data: FaqApiWrite) =>
  prisma.faq.create({ data, select: { id: true } });

export const updateFaqItem = (id: number, data: FaqApiWrite) =>
  prisma.faq.update({ where: { id }, data });

export const deleteFaqItem = (id: number) =>
  prisma.faq.delete({ where: { id } });
