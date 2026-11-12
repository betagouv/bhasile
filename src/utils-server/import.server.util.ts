import { DomainError } from "@/app/utils/domain-error.util";
import { ImportError } from "@/types/import.type";

export const assertImportable = (errors: ImportError[]): void => {
  if (errors.length > 0) {
    throw new DomainError(
      `Le fichier contient ${errors.length} ligne(s) en erreur : corrigez-le puis chargez-le à nouveau`
    );
  }
};
