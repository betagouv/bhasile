import prisma from "@/lib/prisma";

// L'année de campagne est unique : on prend une année hors données réelles, et
// une plage disjointe par fichier car vitest exécute les fichiers en parallèle.
export const pickTestCampaignYear = (rangeStart: number): number =>
  rangeStart + Math.floor(Math.random() * 500);

export const deleteTarificationTestData = async ({
  structureId,
  campaignYear,
}: {
  structureId: number;
  campaignYear: number;
}): Promise<void> => {
  const conversationWhere = { structureTarification: { structureId } };
  const documentWhere = { structureTarification: { structureId } };
  const documents = await prisma.tarificationDocument.findMany({
    where: documentWhere,
    select: { fileUploadId: true },
  });
  await prisma.documentFinancier.deleteMany({
    where: { sourceTarificationDocument: documentWhere },
  });
  await prisma.acteAdministratif.deleteMany({
    where: { sourceTarificationDocument: documentWhere },
  });
  await prisma.tarificationEventNotification.deleteMany({
    where: { event: { structureTarification: { structureId } } },
  });
  await prisma.tarificationDocumentOpening.deleteMany({
    where: { document: documentWhere },
  });
  await prisma.tarificationEvent.deleteMany({ where: documentWhere });
  await prisma.tarificationDocument.deleteMany({ where: documentWhere });
  await prisma.fileUpload.deleteMany({
    where: { id: { in: documents.map((document) => document.fileUploadId) } },
  });
  await prisma.fileUpload.deleteMany({
    where: { message: { conversation: conversationWhere } },
  });
  await prisma.messageReceipt.deleteMany({
    where: { message: { conversation: conversationWhere } },
  });
  await prisma.messageNotificationRecipient.deleteMany({
    where: { message: { conversation: conversationWhere } },
  });
  await prisma.messageNotification.deleteMany({
    where: { message: { conversation: conversationWhere } },
  });
  await prisma.message.deleteMany({
    where: { conversation: conversationWhere },
  });
  await prisma.conversation.deleteMany({ where: conversationWhere });
  await prisma.structureTarification.deleteMany({ where: { structureId } });
  await prisma.tarificationCampaign.deleteMany({
    where: { year: campaignYear, structureTarifications: { none: {} } },
  });
};
