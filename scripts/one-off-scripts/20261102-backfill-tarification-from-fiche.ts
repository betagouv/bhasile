// One-off : reprend dans la campagne 2027 les CA 2025, rapports d'activité 2025, BP 2027 et rapports budgétaires
// 2027 déjà sur la fiche. Rejouable : une structure déjà reliée pour une catégorie est ignorée, et une ligne en échec
// est retentée. Une ligne en échec n'arrête pas les autres : elle est listée à la fin.
//
// Usage : yarn one-off 20261102-backfill-tarification-from-fiche

import "dotenv/config";

import { copyStoredFile } from "@/app/api/files/file.service";
import {
  upsertTarificationCampaign,
  upsertTarificationInCampaign,
} from "@/app/api/tarifications/tarification.repository";
import {
  type DocumentFinancier,
  type FileUpload,
  StructureType,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/client";
import {
  TARIFICATION_DOCUMENT_TYPE_DEFINITIONS,
  TARIFICATION_FICHE_COPY_DEFINITIONS,
  TARIFICATION_FIRST_CAMPAIGN_YEAR,
} from "@/lib/tarification/tarification.definition";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const BACKFILLED_TYPES: TarificationDocumentType[] = [
  "CA",
  "RAPPORT_ACTIVITE",
  "BP",
  "RAPPORT_BUDGETAIRE",
];

// Par structure, la ligne la plus récente ; rien pour une structure déjà reliée à la tarification
const selectBackfillRows = (rows: BackfillRow[]): BackfillRow[] => {
  const linkedStructureIds = new Set(
    rows
      .filter((row) => row.sourceTarificationDocumentId !== null)
      .map((row) => row.structureId)
  );
  const latestRowByStructureId = new Map<number, BackfillRow>();
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

const linkRowToTarification = async ({
  row,
  type,
  campaignId,
}: {
  row: BackfillRow;
  type: TarificationDocumentType;
  campaignId: number;
}): Promise<boolean> => {
  const [fiche] = row.fileUploads;
  const key = await copyStoredFile(
    process.env.S3_BUCKET_NAME!,
    fiche.key,
    fiche.originalName
  );
  return prisma.$transaction(async (tx) => {
    const tarification = await upsertTarificationInCampaign(
      row.structureId!,
      campaignId,
      tx
    );
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
        status: TarificationDocumentStatus.FINAL,
      },
      select: { id: true },
    });
    await tx.tarificationEvent.create({
      data: {
        structureTarificationId: tarification.id,
        type: TarificationEventType.DOCUMENT_DEPOSITED,
        documentId: document.id,
        createdAt: row.createdAt,
      },
    });
    await tx.documentFinancier.update({
      where: { id: row.id },
      data: { sourceTarificationDocumentId: document.id },
    });
    return true;
  });
};

const backfillTarificationFromFiche = async (): Promise<void> => {
  const year = TARIFICATION_FIRST_CAMPAIGN_YEAR;
  const campaign = await upsertTarificationCampaign(year, prisma);
  let linkedCount = 0;
  const failedRowIds: number[] = [];

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
        const isLinked = await linkRowToTarification({
          row,
          type,
          campaignId: campaign.id,
        });
        linkedCount += isLinked ? 1 : 0;
      } catch (error) {
        console.error(`Reprise de la ligne ${row.id} impossible`, error);
        failedRowIds.push(row.id);
      }
    }
  }

  console.log(`✅ ${linkedCount} documents repris depuis la fiche`);
  if (failedRowIds.length > 0) {
    console.error(`❌ Lignes en échec : ${failedRowIds.join(", ")}`);
    process.exitCode = 1;
  }
};

backfillTarificationFromFiche()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

type BackfillRow = DocumentFinancier & { fileUploads: FileUpload[] };
