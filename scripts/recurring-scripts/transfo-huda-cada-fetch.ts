// Pré-remplir les transformations HUDA > CADA depuis l'API de Démarches Numériques
// Usage: yarn script transfo-huda-cada-fetch

import "dotenv/config";

import { createTransformation } from "@/app/api/transformations/transformation.service";
import { createPrismaClient } from "@/prisma-client";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  DNDossierNode,
  DNDossierState,
  fetchAllDossiers,
} from "../utils/demarches-numeriques.util";
import {
  findAgentTransformation,
  resolveHuda,
} from "../utils/transfo-huda-cada.resolve";
import {
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

type Champ = { label: string; stringValue: string };
type HudaCadaDossierNode = DNDossierNode & { champs: Champ[] };

const champValue = (dossier: HudaCadaDossierNode, label: string): string =>
  dossier.champs.find((champ) => champ.label === label)?.stringValue || "";

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
    select: { id: true },
  });
  if (!cada) {
    return { ok: false, reason: `CADA cible : ${codeBhasile} inconnu en base` };
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

type Skipped = { numero: number; reason: string };

const imported: string[] = [];
const skipped: Skipped[] = [];
const inferred: string[] = [];

const dossiers = await fetchDossiers();
console.log(`📝 ${dossiers.length} dossiers soumis récupérés`);

for (const dossier of dossiers) {
  const skip = (reason: string) =>
    skipped.push({ numero: dossier.number, reason });

  const existing = await prisma.transformation.findUnique({
    where: { numeroDossier: String(dossier.number) },
    select: { id: true },
  });
  if (existing) {
    continue;
  }

  const type = parseTransformationType(champValue(dossier, TYPE_LABEL));
  if (!type) {
    skip(
      `type de transformation non reconnu : "${champValue(dossier, TYPE_LABEL).slice(0, 40)}"`
    );
    continue;
  }

  const effectiveDate = resolveEffectiveDate(dossier);
  if (!effectiveDate) {
    skip("aucune date de transformation exploitable");
    continue;
  }

  const resolution = await resolveHuda(
    prisma,
    champValue(dossier, HUDA_BHASILE_LABEL),
    champValue(dossier, HUDA_DNA_LABEL)
  );
  if (!resolution.ok) {
    skip(`HUDA non rattaché — ${resolution.failure.reason}`);
    continue;
  }
  const { huda } = resolution;
  if (huda.via === "codes-dna") {
    inferred.push(`#${dossier.number} → ${huda.codeBhasile}`);
  }

  const agentTransformation = await findAgentTransformation(
    prisma,
    huda.structureId
  );
  if (agentTransformation) {
    skip(
      `transfo #${agentTransformation.id} déjà initiée par un agent sur ${huda.codeBhasile}`
    );
    continue;
  }

  const cadaBrique = await buildCadaBrique(dossier, type, effectiveDate);
  if (!cadaBrique.ok) {
    skip(cadaBrique.reason);
    continue;
  }

  try {
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
      { source: "DEMARCHES_NUMERIQUES", numeroDossier: String(dossier.number) }
    );
    const steps = await markIdentificationPrefilled(id);
    imported.push(
      `#${dossier.number} -> transfo #${id} (${huda.codeBhasile}, ${steps} étape(s) pré-remplie(s))`
    );
  } catch (error) {
    skip(
      `création refusée — ${error instanceof Error ? error.message : String(error)}`
    );
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
  console.log(`⚠️ ${skipped.length} dossier(s) non importé(s) :`);
  skipped.forEach(({ numero, reason }) =>
    console.log(`   #${numero} — ${reason}`)
  );
}
