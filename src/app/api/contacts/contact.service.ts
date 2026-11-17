import { getNow } from "@/app/utils/now.util";

import { resolveDisplayVersion } from "../structure-versions/structure-version.util";
import { isStructureFinalised } from "../structures/structure.util";
import { normalizeEmail } from "../users/user.util";
import { findStructuresWithContactEmail } from "./contact.repository";

export const getContactStructureIds = async (
  email: string
): Promise<number[]> => {
  const now = getNow();
  const structures = await findStructuresWithContactEmail(
    normalizeEmail(email)
  );
  return structures
    .filter(
      (structure) =>
        isStructureFinalised(structure, now) &&
        (resolveDisplayVersion(structure.structureVersions, now)?.contacts
          .length ?? 0) > 0
    )
    .map((structure) => structure.id);
};
