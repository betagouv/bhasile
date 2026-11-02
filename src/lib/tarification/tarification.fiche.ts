import { TarificationDocumentType } from "@/generated/prisma/enums";
import {
  getActiveDocuments,
  getSharedAtByDocumentId,
} from "@/lib/tarification/tarification.compute";
import {
  TARIFICATION_DOCUMENT_TYPE_DEFINITIONS,
  TARIFICATION_FICHE_COPY_DEFINITIONS,
} from "@/lib/tarification/tarification.definition";
import type {
  ExistingFicheCopy,
  FicheCopy,
  TarificationJournal,
} from "@/types/tarification.type";

// Par type de la fiche : le dernier document partagé et non retiré
export const computeFicheCopies = (
  journal: TarificationJournal
): FicheCopy[] => {
  const sharedAtByDocumentId = getSharedAtByDocumentId(journal);
  const sharedDocuments = getActiveDocuments(journal)
    .filter((document) => sharedAtByDocumentId.has(document.id))
    .sort(
      (firstDocument, secondDocument) =>
        sharedAtByDocumentId.get(firstDocument.id)!.getTime() -
          sharedAtByDocumentId.get(secondDocument.id)!.getTime() ||
        firstDocument.id - secondDocument.id
    );

  return Object.values(TarificationDocumentType).flatMap((type) => {
    const definition = TARIFICATION_FICHE_COPY_DEFINITIONS[type];
    const latestDocument = sharedDocuments
      .filter((document) => document.types.includes(type))
      .at(-1);
    if (!definition || !latestDocument) {
      return [];
    }
    return [
      {
        ...definition,
        documentId: latestDocument.id,
        year:
          journal.campaignYear +
          TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type].exerciseOffset,
      },
    ];
  });
};

export const computeFicheCopyChanges = (
  desiredCopies: FicheCopy[],
  existingCopies: ExistingFicheCopy[]
): { copiesToCreate: FicheCopy[]; copiesToDelete: ExistingFicheCopy[] } => {
  const isSameCopy = (
    existingCopy: ExistingFicheCopy,
    desiredCopy: FicheCopy
  ): boolean =>
    existingCopy.documentId === desiredCopy.documentId &&
    existingCopy.target === desiredCopy.target &&
    existingCopy.category === desiredCopy.category;

  return {
    copiesToCreate: desiredCopies.filter(
      (desiredCopy) =>
        !existingCopies.some((existingCopy) =>
          isSameCopy(existingCopy, desiredCopy)
        )
    ),
    copiesToDelete: existingCopies.filter(
      (existingCopy) =>
        !desiredCopies.some((desiredCopy) =>
          isSameCopy(existingCopy, desiredCopy)
        )
    ),
  };
};
