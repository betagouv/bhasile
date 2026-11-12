import { DomainError } from "@/app/utils/domain-error.util";
import { formatPlural } from "@/app/utils/string.util";
import { ImportError } from "@/types/import.type";

export const assertImportable = (errors: ImportError[]): void => {
  if (errors.length > 0) {
    throw new DomainError(
      `Le fichier contient ${formatPlural(errors.length, "ligne")} en erreur : corrigez-le puis chargez-le à nouveau`
    );
  }
};
