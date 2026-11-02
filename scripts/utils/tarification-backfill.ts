import { copyStoredFile } from "@/app/api/files/file.service";
import {
  type DocumentFinancier,
  type FileUpload,
  type PrismaClient,
  StructureType,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/client";
import {
  TARIFICATION_DOCUMENT_TYPE_DEFINITIONS,
  TARIFICATION_FICHE_COPY_DEFINITIONS,
} from "@/lib/tarification/tarification.definition";

const BACKFILLED_TYPES: TarificationDocumentType[] = [
  "CA",
  "RAPPORT_ACTIVITE",
  "BP",
  "RAPPORT_BUDGETAIRE",
];

// Par structure, la ligne la plus récente ; rien pour une structure déjà reliée à la tarification
export const selectBackfillRows = <
  TRow extends {
    structureId: number | null;
    sourceTarificationDocumentId: number | null;
    createdAt: Date;
    id: number;
  },
>(
  rows: TRow[]
): TRow[] => {
  const linkedStructureIds = new Set(
    rows
      .filter((row) => row.sourceTarificationDocumentId !== null)
      .map((row) => row.structureId)
  );
  const latestRowByStructureId = new Map<number, TRow>();
  for (const row of rows) {
    if (row.structureId === null || linkedStructureIds.has(row.structureId)) {
      continue;
    }
    const latestRow = latestRowByStructureId.get(row.structureId);
    const isMoreRecent =
      !latestRow ||
      row.createdAt > latestRow.createdAt ||
      (row.createdAt.getTime() === latestRow.createdAt.getTime() &&
        row.id > latestRow.id);
    if (isMoreRecent) {
      latestRowByStructureId.set(row.structureId, row);
    }
  }
  return [...latestRowByStructureId.values()];
};

export const backfillTarificationFromFiche = async (
  prisma: PrismaClient,
  year: number
): Promise<BackfillResult> => {
  const campaign = await prisma.tarificationCampaign.upsert({
    where: { year },
    update: { year },
    create: { year },
    select: { id: true },
  });
  const result: BackfillResult = { linkedCount: 0, failedRowIds: [] };

  for (const type of BACKFILLED_TYPES) {
    const copyDefinition = TARIFICATION_FICHE_COPY_DEFINITIONS[type];
    if (copyDefinition?.target !== "DOCUMENT_FINANCIER") {
      continue;
    }
    const rows = await prisma.documentFinancier.findMany({
      where: {
        category: copyDefinition.category,
        year:
          year + TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type].exerciseOffset,
        structure: { type: { in: [StructureType.CADA, StructureType.CPH] } },
        fileUploads: { some: {} },
      },
      include: { fileUploads: { orderBy: { id: "desc" }, take: 1 } },
    });

    for (const row of selectBackfillRows(rows)) {
      try {
        const isLinked = await linkRowToTarification(prisma, {
          row,
          type,
          campaignId: campaign.id,
        });
        result.linkedCount += isLinked ? 1 : 0;
      } catch (error) {
        console.error(`Reprise de la ligne ${row.id} impossible`, error);
        result.failedRowIds.push(row.id);
      }
    }
  }
  return result;
};

const linkRowToTarification = async (
  prisma: PrismaClient,
  {
    row,
    type,
    campaignId,
  }: {
    row: DocumentFinancier & { fileUploads: FileUpload[] };
    type: TarificationDocumentType;
    campaignId: number;
  }
): Promise<boolean> => {
  const [fiche] = row.fileUploads;
  const key = await copyStoredFile(
    process.env.S3_BUCKET_NAME!,
    fiche.key,
    fiche.originalName
  );
  return prisma.$transaction(async (tx) => {
    const tarification = await tx.structureTarification.upsert({
      where: {
        structureId_campaignId: {
          structureId: row.structureId!,
          campaignId,
        },
      },
      update: { campaignId },
      create: { structureId: row.structureId!, campaignId },
      select: { id: true },
    });
    const linkedRow = await tx.documentFinancier.findFirst({
      where: {
        structureId: row.structureId,
        category: row.category,
        year: row.year,
        sourceTarificationDocumentId: { not: null },
      },
      select: { id: true },
    });
    if (linkedRow) {
      return false;
    }
    const fileUpload = await tx.fileUpload.create({
      data: {
        key,
        originalName: fiche.originalName,
        mimeType: fiche.mimeType,
        fileSize: fiche.fileSize,
        sha256: fiche.sha256,
      },
      select: { id: true },
    });
    const document = await tx.tarificationDocument.create({
      data: {
        structureTarificationId: tarification.id,
        fileUploadId: fileUpload.id,
        types: [type],
        status: TarificationDocumentStatus.SHARED,
      },
      select: { id: true },
    });
    const event = await tx.tarificationEvent.create({
      data: {
        structureTarificationId: tarification.id,
        type: TarificationEventType.DOCUMENT_DEPOSITED,
        documentId: document.id,
        createdAt: row.createdAt,
      },
      select: { id: true },
    });
    await tx.tarificationEventNotification.create({
      data: { eventId: event.id },
    });
    await tx.documentFinancier.update({
      where: { id: row.id },
      data: { sourceTarificationDocumentId: document.id },
    });
    return true;
  });
};

type BackfillResult = { linkedCount: number; failedRowIds: number[] };
