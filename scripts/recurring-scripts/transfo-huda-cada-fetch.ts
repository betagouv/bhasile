// Pré-remplir les transformations HUDA > CADA depuis l'API de Démarche Numérique
// Usage: yarn script transfo-huda-cada-fetch

import "dotenv/config";

import { getActeAdministratifPeriods } from "@/app/api/actes-administratifs/acte-administratif.util";
import { createTransformation } from "@/app/api/transformations/transformation.service";
import { isCurrentlyInEffect } from "@/app/utils/date.util";
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
  cleanDate,
  DNDossierNode,
  DNDossierState,
  DNField,
  DNFieldDescriptor,
  fetchAllDossiers,
  FIELD_FRAGMENT,
  getFieldValue,
} from "../utils/demarche-numerique.util";
import {
  findHudaCadaTransformations,
  matchesEnvelope,
  ResolvedStructure,
  resolveHudas,
  resolveTargetCada,
} from "../utils/transfo-huda-cada.resolve";
import {
  isAmbiguousFusion,
  isEffectiveDateInScope,
  parseDepartement,
  parseTransformationType,
} from "../utils/transfo-huda-cada.util";

const prisma = createPrismaClient();

const HUDA_CADA_DEMARCHE_NUMBER = 128242;

/* Seuls les dossiers réellement soumis par la DDETS (on omet les brouillons) */
const STATES_TO_IMPORT: DNDossierState[] = ["accepte", "en_instruction"];

const WINDOW_TO_FETCH_DAYS: number | null = null;

const TYPE = {
  id: "Q2hhbXAtNTYzODYzMg==",
  label: "Quelle type de transformation HUDA-CADA est prévue ?",
};
const CADA_BHASILE = {
  id: "Q2hhbXAtNjM0MzIyNw==",
  label: "Code Bhasile du CADA",
};
const CADA_DNA = {
  id: "Q2hhbXAtNTYzODc0Ng==",
  label: "Code OFII du CADA",
};
const DEPARTEMENT = {
  id: "Q2hhbXAtNTYzNzExNw==",
  label: "Département",
};
const DATE_PREVISIONNELLE = {
  id: "Q2hhbXAtNjMzOTY2Mg==",
  label: "Date prévisionnelle de la transformation",
};
const DATE_EFFECTIVE = {
  id: "Q2hhbXAtNjMzODMzOQ==",
  label: "Date effective de la transformation",
};
const CADA_ETENDU_CAPACITE = {
  id: "Q2hhbXAtNTYzODgzOA==",
  label: "Nouvelle capacité de l'établissement étendu",
};

/* Un dossier ne renseigne qu'une branche du formulaire (extension ou création) :
 * les champs des deux branches cohabitent ici, seuls les remplis ressortent. */
const HUDA_BHASILE = [
  { id: "Q2hhbXAtNjMzNjQ1OA==", label: "Code Bhasile de l'HUDA" },
  { id: "Q2hhbXAtNTY4NDMzMg==", label: "Code Bhasile de l'HUDA 2 (extension)" },
  { id: "Q2hhbXAtNjM0MzU1NA==", label: "Code Bhasile de l'HUDA 2 (création)" },
];
const HUDA_DNA = [
  { id: "Q2hhbXAtNTYzNzcwNw==", label: "Code(s) DNA de l'HUDA" },
  { id: "Q2hhbXAtNjM0MDAwMw==", label: "Code(s) DNA HUDA 2 (extension)" },
  { id: "Q2hhbXAtNTY4ODA3Nw==", label: "Code(s) DNA de l'HUDA 2 (création)" },
];

/* La section « nouveau CADA » ne comporte pas de capacité propre bien remplie :
 * on retombe sur le nombre de places transformées, renseigné dans la majorité
 * des dossiers. Le premier champ renseigné l'emporte. */
const CADA_NOUVEAU_CAPACITE = [
  {
    id: "Q2hhbXAtNTYzODk5Ng==",
    label: "Nombre de places de l'établissement transformé",
  },
  {
    id: "Q2hhbXAtNTY1ODY1NQ==",
    label: "Capacité du nouveau CADA créé dans le cadre de la transformation",
  },
];

type HudaCadaDossierNode = DNDossierNode & { champs: DNField[] };

const champValue = (
  dossier: HudaCadaDossierNode,
  descriptor: DNFieldDescriptor
): string => getFieldValue(dossier.champs, descriptor);

const champValues = (
  dossier: HudaCadaDossierNode,
  descriptors: DNFieldDescriptor[]
): string[] =>
  descriptors
    .map((descriptor) => champValue(dossier, descriptor).trim())
    .filter(Boolean);

const fetchDossiers = async (): Promise<HudaCadaDossierNode[]> => {
  const dossiers: HudaCadaDossierNode[] = [];
  for (const state of STATES_TO_IMPORT) {
    dossiers.push(
      ...(await fetchAllDossiers<HudaCadaDossierNode>({
        demarcheNumber: HUDA_CADA_DEMARCHE_NUMBER,
        champsFragment: FIELD_FRAGMENT,
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
  cleanDate(champValue(dossier, DATE_EFFECTIVE)) ??
  cleanDate(champValue(dossier, DATE_PREVISIONNELLE));

const parsePositiveInt = (raw: string): number | null => {
  const value = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const resolveNewCadaCapacity = (
  dossier: HudaCadaDossierNode
): number | null => {
  for (const descriptor of CADA_NOUVEAU_CAPACITE) {
    const capacity = parsePositiveInt(champValue(dossier, descriptor));
    if (capacity !== null) {
      return capacity;
    }
  }
  return null;
};

/* Le formulaire écrit la capacité aux deux endroits et relit `structureVersion` :
 * pré-remplir l'un sans l'autre donne soit un champ vide, soit une typologie manquante. */
const buildCapacityFields = (capacity: number | null, effectiveDate: Date) => ({
  structureTypologies: capacity
    ? [{ year: effectiveDate.getUTCFullYear(), placesAutorisees: capacity }]
    : undefined,
  placesAutorisees: capacity ?? undefined,
});

/* La nouvelle convention couvre le temps restant de celle en vigueur à la date
 * d'effet — pas aujourd'hui, et pas la plus récente si elle est expirée. */
const findConventionEndDate = async (
  structureId: number,
  effectiveDate: Date
): Promise<Date | null> => {
  const actesAdministratifs = await prisma.acteAdministratif.findMany({
    where: { structureId },
    select: {
      id: true,
      category: true,
      parentId: true,
      startDate: true,
      endDate: true,
    },
  });
  const period = getActeAdministratifPeriods(
    actesAdministratifs,
    "CONVENTION"
  ).find(([startDate, endDate]) =>
    isCurrentlyInEffect(startDate, endDate, effectiveDate)
  );
  return period?.[1] ?? null;
};

const buildCadaBrique = async (
  dossier: HudaCadaDossierNode,
  type: TransformationType,
  effectiveDate: Date,
  hudas: ResolvedStructure[],
  departement: string | null
): Promise<
  | { ok: true; brique: StructureVersionTransformationApiCreate }
  | { ok: false; reason: string }
> => {
  const effectiveDateIso = effectiveDate.toISOString();

  if (
    type === TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
  ) {
    /* « Même opérateur » : le nouveau CADA reprend celui des HUDA fermés, plus fiable
     * qu'un rapprochement sur le SIRET. Des opérateurs divergents contredisent le cas de figure. */
    const operateurIds = [...new Set(hudas.map((huda) => huda.operateurId))];
    if (operateurIds.length > 1) {
      return {
        ok: false,
        reason: `les HUDA fermés relèvent de ${operateurIds.length} opérateurs différents`,
      };
    }

    const { structureTypologies, placesAutorisees } = buildCapacityFields(
      resolveNewCadaCapacity(dossier),
      effectiveDate
    );
    return {
      ok: true,
      brique: {
        type: StructureVersionTransformationType.CREATION,
        operateurId: operateurIds[0] ?? undefined,
        structureType: StructureType.CADA,
        structureTypologies,
        structureVersion: {
          effectiveDate: effectiveDateIso,
          placesAutorisees,
        },
      },
    };
  }

  const targetCada = await resolveTargetCada(
    prisma,
    {
      rawBhasileCode: champValue(dossier, CADA_BHASILE),
      rawDnaCodes: [champValue(dossier, CADA_DNA)],
      departement,
    },
    effectiveDate
  );
  if (!targetCada.ok) {
    return { ok: false, reason: `CADA cible : ${targetCada.failure.reason}` };
  }

  const { structureTypologies, placesAutorisees } = buildCapacityFields(
    parsePositiveInt(champValue(dossier, CADA_ETENDU_CAPACITE)),
    effectiveDate
  );
  const conventionEndDate = await findConventionEndDate(
    targetCada.value.structureId,
    effectiveDate
  );

  return {
    ok: true,
    brique: {
      type: StructureVersionTransformationType.EXTENSION,
      structureTypologies,
      actesAdministratifs: conventionEndDate
        ? [
            {
              category: "CONVENTION",
              startDate: effectiveDateIso,
              endDate: conventionEndDate.toISOString(),
            },
          ]
        : undefined,
      structureVersion: {
        structureId: targetCada.value.structureId,
        effectiveDate: effectiveDateIso,
        placesAutorisees,
      },
    },
  };
};

/* Étapes alimentées par le script :
 * - identification (toutes briques) : structure, date d'effet, opérateur ;
 * - places-hébergement : capacité (recopiée depuis Bhasile pour l'extension,
 *   issue du dossier DN pour la création). La brique fermeture n'a pas cette
 *   étape, l'updateMany ne la touche donc pas. */
const PREFILLED_STEP_SLUGS = ["01-identification", "02-places-hebergement"];

const markStepsPrefilled = async (
  transformationId: number
): Promise<number> => {
  const { count } = await prisma.formStep.updateMany({
    where: {
      status: StepStatus.NON_COMMENCE,
      stepDefinition: { slug: { in: PREFILLED_STEP_SLUGS } },
      form: { structureVersionTransformation: { transformationId } },
    },
    data: { status: StepStatus.PRE_REMPLI },
  });
  return count;
};

type DossierReport = { numero: number; reason: string };

const imported: string[] = [];
const linked: string[] = [];
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

  const rawType = champValue(dossier, TYPE);
  if (isAmbiguousFusion(rawType)) {
    skip(
      "fusion d'un CADA existant : le dossier ne désigne pas le CADA à absorber"
    );
    return;
  }
  const type = parseTransformationType(rawType);
  if (!type) {
    skip(`type de transformation non reconnu : "${rawType.slice(0, 40)}"`);
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

  const departement = parseDepartement(champValue(dossier, DEPARTEMENT));

  const resolution = await resolveHudas(
    prisma,
    {
      rawBhasileCodes: champValues(dossier, HUDA_BHASILE),
      rawDnaCodes: champValues(dossier, HUDA_DNA),
      departement,
    },
    effectiveDate
  );
  if (!resolution.ok) {
    skip(`HUDA non rattaché — ${resolution.failure.reason}`);
    return;
  }
  const hudas = resolution.value;

  const structureIds = hudas.map((huda) => huda.structureId);
  const existingTransformations = await findHudaCadaTransformations(
    prisma,
    structureIds
  );

  if (existingTransformations.length > 0) {
    /* Une transfo saisie dans Bhasile avant le dépôt du dossier : on lui rattache le
     * numéro pour l'idempotence, sans jamais écraser ce qui a été commencé. */
    const [existing] = existingTransformations;
    if (
      existingTransformations.length === 1 &&
      existing.numeroDossier === null &&
      matchesEnvelope(existing, structureIds)
    ) {
      await prisma.transformation.update({
        where: { id: existing.id },
        data: { numeroDossier: String(dossier.number) },
      });
      linked.push(`#${dossier.number} → transfo #${existing.id}`);
      return;
    }

    skip(
      `transfo(s) ${existingTransformations.map(({ id }) => `#${id}`).join(", ")} déjà ouverte(s) sur ${hudas
        .map((huda) => huda.codeBhasile)
        .join(", ")}`
    );
    return;
  }

  const cadaBrique = await buildCadaBrique(
    dossier,
    type,
    effectiveDate,
    hudas,
    departement
  );
  if (!cadaBrique.ok) {
    skip(cadaBrique.reason);
    return;
  }

  const id = await createTransformation(
    {
      type,
      structureVersionTransformations: [
        ...hudas.map((huda) => ({
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: {
            structureId: huda.structureId,
            effectiveDate: effectiveDate.toISOString(),
          },
        })),
        cadaBrique.brique,
      ],
    },
    undefined,
    String(dossier.number)
  );
  const steps = await markStepsPrefilled(id);
  const bhasileCodes = hudas.map((huda) => huda.codeBhasile).join(", ");
  imported.push(
    `#${dossier.number} -> transfo #${id} (${bhasileCodes}, ${steps} étape(s) pré-remplie(s))`
  );
  const viaDna = hudas.filter((huda) => huda.via === "codes-dna");
  if (viaDna.length > 0) {
    inferred.push(
      `#${dossier.number} → ${viaDna.map((huda) => huda.codeBhasile).join(", ")}`
    );
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

if (linked.length) {
  console.log(
    `📎 ${linked.length} dossier(s) rattaché(s) à une transformation déjà saisie dans Bhasile`
  );
  linked.forEach((line) => console.log(`   ${line}`));
}

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
