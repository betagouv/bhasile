import { z } from "zod";

import type { StructureAnomalieDb } from "@/app/api/anomalies/anomalie.db.type";
import type {
  AnomalieContexte,
  StructureContexte,
} from "@/lib/anomalies/anomalie.contexte";
import { StructureType } from "@/types/structure.type";

const CODE_REGION_IDF = "FR-IDF";

export const buildAnomalieContexte = (
  dbStructure: StructureAnomalieDb
): AnomalieContexte => {
  const version = dbStructure.structureVersions.at(0);
  const dnas = (version?.dnaStructures ?? []).map(({ dna }) => dna);

  return {
    structure: buildStructureContexte(dbStructure),
    typologies: dbStructure.structureTypologies.map((typologie) => ({
      year: typologie.year,
      placesAutorisees: typologie.placesAutorisees,
      pmr: typologie.pmr,
      lgbt: typologie.lgbt,
      fvvTeh: typologie.fvvTeh,
    })),
    actes: dbStructure.actesAdministratifs
      .filter((acte) => acte.category !== null)
      .map((acte) => ({
        id: acte.id,
        category: acte.category as NonNullable<typeof acte.category>,
        startDate: acte.startDate,
        endDate: acte.endDate,
        isMissing: acte.isMissing,
        parentId: acte.parentId,
        cpomId: acte.cpomId,
        hasFile: acte._count.fileUploads > 0,
      })),
    adresses: version?.adresses ?? [],
    budgets: dbStructure.budgets.map((budget) => ({
      ...budget,
      isMissing: budget.isMissing,
    })),
    indicateurs: dbStructure.indicateursFinanciers.map((indicateur) => ({
      year: indicateur.year,
      type: indicateur.type,
      isMissing: indicateur.isMissing,
      tauxEncadrement: indicateur.tauxEncadrement,
      coutJournalier: indicateur.coutJournalier,
    })),
    evaluations: dbStructure.evaluations,
    dnas: dnas.map((dna) => ({ id: dna.id, code: dna.code })),
    cpoms: dbStructure.cpomStructures.map(({ cpom }) => ({
      id: cpom.id,
      structuresCount: cpom._count.structures,
      hasConventionDocument: cpom.actesAdministratifs.some(
        (acte) =>
          acte.category === "CONVENTION" &&
          acte.parentId === null &&
          acte.isMissing !== true &&
          acte._count.fileUploads > 0
      ),
    })),
    activites: dnas.flatMap((dna) =>
      dna.activites.map((activite) => ({
        dnaCode: dna.code,
        placesAutorisees: activite.placesAutorisees,
        placesIndisponibles: activite.placesIndisponibles,
        presencesInduesBPI: activite.presencesInduesBPI,
        presencesInduesDeboutees: activite.presencesInduesDeboutees,
      }))
    ),
  };
};

// Le tarif cible vivait dans reporting.tarif_journalier_cible : passé en variable
// d'environnement pour que le calcul ne dépende pas du schéma de reporting.
// Absent => la règle COUT_JOURNALIER_GT_TARIF_CIBLE ne déclenche pas.
export const tarifJournalierCible = (
  type: StructureType | null,
  estIdf: boolean
): number | null => {
  if (type === null) {
    return null;
  }

  const tarif = TARIFS_JOURNALIERS_CIBLES[type];

  return tarif === undefined ? null : estIdf ? tarif.idf : tarif.horsIdf;
};

const buildStructureContexte = (
  dbStructure: StructureAnomalieDb
): StructureContexte => {
  const version = dbStructure.structureVersions.at(0);
  const type = dbStructure.type as StructureType | null;
  const estIdf =
    dbStructure.departement?.regionAdministrative?.code === CODE_REGION_IDF;

  return {
    type,
    departementAdministratif: dbStructure.departementAdministratif,
    tarifJournalierCible: tarifJournalierCible(type, estIdf),
    creationDate: dbStructure.creationDate,
    date303: dbStructure.date303,
    placesAutorisees: version?.placesAutorisees ?? null,
    lgbt: version?.lgbt ?? null,
    fvvTeh: version?.fvvTeh ?? null,
    debutConvention: dbStructure.debutConvention,
    finConvention: dbStructure.finConvention,
    debutPeriodeAutorisation: dbStructure.debutPeriodeAutorisation,
    finPeriodeAutorisation: dbStructure.finPeriodeAutorisation,
  };
};

const tarifsSchema = z.record(
  z.string(),
  z.object({ idf: z.number(), horsIdf: z.number() })
);

type TarifsJournaliersCibles = Partial<
  Record<StructureType, { idf: number; horsIdf: number }>
>;

const parseTarifs = (): TarifsJournaliersCibles => {
  const brut = process.env.TARIF_JOURNALIER_CIBLE;
  if (brut === undefined || brut === "") {
    return {};
  }

  try {
    return tarifsSchema.parse(JSON.parse(brut));
  } catch {
    console.error("TARIF_JOURNALIER_CIBLE illisible, tarifs ignorés");
    return {};
  }
};

const TARIFS_JOURNALIERS_CIBLES = parseTarifs();
