import { DomainError } from "@/app/utils/domain-error.util";
import { formatPlural } from "@/app/utils/string.util";
import { ImportError } from "@/types/import.type";

export class ImportRejectedError extends DomainError {
  constructor(readonly errors: ImportError[]) {
    super(
      `Le fichier contient ${formatPlural(errors.length, "ligne")} en erreur : corrigez-le puis chargez-le à nouveau`
    );
    this.name = "ImportRejectedError";
  }
}

export const assertImportable = (errors: ImportError[]): void => {
  if (errors.length > 0) {
    throw new ImportRejectedError(errors);
  }
};
