import { normalizeCommuneName } from "@/app/utils/adresse.util";
import { PrismaTransaction } from "@/types/prisma.type";

import {
  CommuneReferentielRow,
  findCommunesByCodePostal,
  findCommunesByNormalizedName,
} from "./commune.repository";

/**
 * Résout l'arrondissement départemental d'une adresse.
 *
 * Le couple (code postal, nom de commune normalisé) est strictement discriminant sur
 * le référentiel COG : il ne produit aucune collision. À défaut de correspondance sur
 * le nom, le code postal seul suffit tant qu'il ne recouvre qu'un arrondissement, ce
 * qui est le cas de 90 % d'entre eux. Toute ambiguïté résiduelle renvoie `null` : le
 * rattachement se fait alors à la main.
 */
export const resolveArrondissementCode = async (
  codePostal: string | null | undefined,
  commune: string | null | undefined,
  tx?: PrismaTransaction
): Promise<string | null> => {
  const normalizedCodePostal = codePostal?.trim();
  if (!normalizedCodePostal) {
    return null;
  }

  if (commune?.trim()) {
    const byName = await findCommunesByNormalizedName(
      normalizeCommuneName(commune),
      tx
    );
    const exactMatches = byName.filter((candidate) =>
      candidate.codesPostaux.includes(normalizedCodePostal)
    );
    if (exactMatches.length === 1) {
      return exactMatches[0].arrondissementCode;
    }
  }

  return getUniqueArrondissementCode(
    await findCommunesByCodePostal(normalizedCodePostal, tx)
  );
};

const getUniqueArrondissementCode = (
  candidates: CommuneReferentielRow[]
): string | null => {
  const codes = new Set(
    candidates.map((candidate) => candidate.arrondissementCode)
  );
  const [code] = [...codes];
  return codes.size === 1 && code ? code : null;
};
