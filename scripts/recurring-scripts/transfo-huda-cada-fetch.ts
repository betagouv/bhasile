// Pré-remplir les transformations HUDA > CADA depuis l'API de Démarches Numériques
// Usage: yarn script transfo-huda-cada-fetch

import "dotenv/config";

import { createTransformation } from "@/app/api/transformations/transformation.service";
import { TRANSFORMATION_START_YEAR } from "@/constants";
import { createPrismaClient } from "@/prisma-client";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  DNColumn,
  DNDossierNode,
  DNDossierState,
  fetchAllDossiers,
  getValueByLabel,
} from "../utils/demarches-numeriques.util";
import {
  describeType,
  findExistingHudaCadaTransformation,
  hasExpectedType,
  resolveHuda,
} from "../utils/transfo-huda-cada.resolve";
import {
  isEffectiveDateInScope,
  normalizeBhasileCode,
  parseFrenchDate,
  parseTransformationType,
} from "../utils/transfo-huda-cada.util";

const prisma = createPrismaClient();

const HUDA_CADA_DEMARCHE_NUMBER = 128242;

/* Seuls les dossiers réellement soumis par la DDETS (on omet les brouillons) */
const STATES_TO_IMPORT: DNDossierState[] = ["accepte", "en_instruction"];

const WINDOW_TO_FETCH_DAYS: number | null = null;

const TYPE_LABEL = "Quelle type de transformation HUDA-CADA est prévue ?";
const HUDA_BHASILE_LABEL = "Code Bhasile de l'HUDA";
const HUDA_DNA_LABEL = "Code(s) DNA de l'HUDA";
const CADA_BHASILE_LABEL = "Code Bhasile du CADA";
const DATE_PREVISIONNELLE_LABEL = "Date prévisionnelle de la transformation";
const DATE_EFFECTIVE_LABEL = "Date effective de la transformation";

type HudaCadaDossierNode = DNDossierNode & { champs: DNColumn[] };

const champValue = (dossier: HudaCadaDossierNode, label: string): string =>
  getValueByLabel(dossier.champs, label);

const fetchDossiers = async (): Promise<HudaCadaDossierNode[]> => {
  const dossiers: HudaCadaDossierNode[] = [];
  for (const state of STATES_TO_IMPORT) {
    dossiers.push(
      ...(await fetchAllDossiers<HudaCadaDossierNode>({
        demarcheNumber: HUDA_CADA_DEMARCHE_NUMBER,
        champsFragment: `champs {
					label
					stringValue
				}`,
        label: `dossiers HUDA>CADA (${state})`,
        windowToFetchDays: WINDOW_TO_FETCH_DAYS,
        state,
      }))
    );
  }
  return dossiers;
};

/** La date effective prime quand elle existe, sinon la prévisionnelle. */
const resolveEffectiveDate = (dossier: HudaCadaDossierNode): Date | null =>
  parseFrenchDate(champValue(dossier, DATE_EFFECTIVE_LABEL)) ??
  parseFrenchDate(champValue(dossier, DATE_PREVISIONNELLE_LABEL));

const buildCadaBrique = async (
  dossier: HudaCadaDossierNode,
  type: TransformationType,
  effectiveDate: Date
): Promise<
  | { ok: true; brique: StructureVersionTransformationApiCreate }
  | { ok: false; reason: string }
> => {
  const effectiveDateIso = effectiveDate.toISOString();

  if (
    type === TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
  ) {
    return {
      ok: true,
      brique: {
        type: StructureVersionTransformationType.CREATION,
        structureType: StructureType.CADA,
        structureVersion: { effectiveDate: effectiveDateIso },
      },
    };
  }

  const codeBhasile = normalizeBhasileCode(
    champValue(dossier, CADA_BHASILE_LABEL)
  );
  if (!codeBhasile) {
    return {
      ok: false,
      reason: "CADA cible : code Bhasile absent ou illisible",
    };
  }

  const cada = await prisma.structure.findUnique({
    where: { codeBhasile },
    select: { id: true, codeBhasile: true, type: true },
  });
  if (!cada) {
    return { ok: false, reason: `CADA cible : ${codeBhasile} inconnu en base` };
  }
  if (!hasExpectedType(cada, StructureType.CADA)) {
    return {
      ok: false,
      reason: `CADA cible : ${codeBhasile} n'est pas un CADA (${describeType(cada)})`,
    };
  }

  return {
    ok: true,
    brique: {
      type: StructureVersionTransformationType.EXTENSION,
      structureVersion: {
        structureId: cada.id,
        effectiveDate: effectiveDateIso,
      },
    },
  };
};

/* Seule cette étape est alimentée par le script (structure et date d'effet).
 * TODO: intégrer reste des champs
 */
const IDENTIFICATION_STEP_SLUG = "01-identification";

const markIdentificationPrefilled = async (
  transformationId: number
): Promise<number> => {
  const { count } = await prisma.formStep.updateMany({
    where: {
      status: StepStatus.NON_COMMENCE,
      stepDefinition: { slug: IDENTIFICATION_STEP_SLUG },
      form: { structureVersionTransformation: { transformationId } },
    },
    data: { status: StepStatus.PRE_REMPLI },
  });
  return count;
};

type DossierReport = { numero: number; reason: string };

const imported: string[] = [];
const skipped: DossierReport[] = [];
const failed: DossierReport[] = [];
const inferred: string[] = [];

/* Un dossier hors cadre ou en erreur ne doit jamais empêcher les suivants d'être importés :
 * on collecte tout et on rend compte à la fin. */
const importDossier = async (dossier: HudaCadaDossierNode): Promise<void> => {
  const skip = (reason: string) =>
    skipped.push({ numero: dossier.number, reason });

  const existing = await prisma.transformation.findUnique({
    where: { numeroDossier: String(dossier.number) },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  const type = parseTransformationType(champValue(dossier, TYPE_LABEL));
  if (!type) {
    skip(
      `type de transformation non reconnu : "${champValue(dossier, TYPE_LABEL).slice(0, 40)}"`
    );
    return;
  }

  const effectiveDate = resolveEffectiveDate(dossier);
  if (!effectiveDate) {
    skip("aucune date de transformation exploitable");
    return;
  }
  if (!isEffectiveDateInScope(effectiveDate)) {
    skip(
      `date de transformation ${effectiveDate.toLocaleDateString("fr-FR")} antérieure à ${TRANSFORMATION_START_YEAR}`
    );
    return;
  }

  const resolution = await resolveHuda(
    prisma,
    champValue(dossier, HUDA_BHASILE_LABEL),
    champValue(dossier, HUDA_DNA_LABEL)
  );
  if (!resolution.ok) {
    skip(`HUDA non rattaché — ${resolution.failure.reason}`);
    return;
  }
  const { huda } = resolution;

  const existingTransformation = await findExistingHudaCadaTransformation(
    prisma,
    huda.structureId
  );
  if (existingTransformation) {
    skip(
      `transfo #${existingTransformation.id} déjà ouverte sur ${huda.codeBhasile}${
        existingTransformation.numeroDossier
          ? ` (dossier #${existingTransformation.numeroDossier})`
          : ""
      }`
    );
    return;
  }

  const cadaBrique = await buildCadaBrique(dossier, type, effectiveDate);
  if (!cadaBrique.ok) {
    skip(cadaBrique.reason);
    return;
  }

  const id = await createTransformation(
    {
      type,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: {
            structureId: huda.structureId,
            effectiveDate: effectiveDate.toISOString(),
          },
        },
        cadaBrique.brique,
      ],
    },
    String(dossier.number)
  );
  const steps = await markIdentificationPrefilled(id);
  imported.push(
    `#${dossier.number} -> transfo #${id} (${huda.codeBhasile}, ${steps} étape(s) pré-remplie(s))`
  );
  if (huda.via === "codes-dna") {
    inferred.push(`#${dossier.number} → ${huda.codeBhasile}`);
  }
};

const dossiers = await fetchDossiers();
console.log(`📝 ${dossiers.length} dossiers soumis récupérés`);

for (const dossier of dossiers) {
  try {
    await importDossier(dossier);
  } catch (error) {
    failed.push({
      numero: dossier.number,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(`✅ ${imported.length} transformation(s) créée(s)`);
imported.forEach((line) => console.log(`   ${line}`));

if (inferred.length) {
  console.log(
    `🔗 ${inferred.length} HUDA rattaché(s) via les codes DNA (code Bhasile absent ou invalide)`
  );
  inferred.forEach((line) => console.log(`   ${line}`));
}

if (skipped.length) {
  console.log(`⚠️ ${skipped.length} dossier(s) hors cadre, non importé(s) :`);
  skipped.forEach(({ numero, reason }) =>
    console.log(`   #${numero} — ${reason}`)
  );
}

if (failed.length) {
  console.log(`❌ ${failed.length} dossier(s) en erreur :`);
  failed.forEach(({ numero, reason }) =>
    console.log(`   #${numero} — ${reason}`)
  );
}
