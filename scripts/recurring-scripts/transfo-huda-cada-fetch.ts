// Pré-remplir les transformations HUDA > CADA depuis l'API de Démarche Numérique
// Usage: yarn script transfo-huda-cada-fetch

import "dotenv/config";

import { getActeAdministratifPeriods } from "@/app/api/actes-administratifs/acte-administratif.util";
import { resolvePredecessor } from "@/app/api/structure-versions/structure-version.util";
import { createTransformation } from "@/app/api/transformations/transformation.service";
import { isCurrentlyInEffect } from "@/app/utils/date.util";
import { parseStrictInt } from "@/app/utils/number.util";
import { TRANSFORMATION_TYPE_SPECS } from "@/config/transformation.config";
import { TRANSFORMATION_START_YEAR } from "@/constants";
import { StepStatus as DbStepStatus } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";
import {
  HudaCadaDepartureType,
  LegacyHudaTransformationType,
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
  parseHudaCadaDestination,
  resolveHudaCadaTransformationType,
  resolveHudaDepartureType,
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
const HUDA_CAPACITE_AVANT = {
  id: "Q2hhbXAtNTYzNzcyMA==",
  label:
    "Capacité totale de l'HUDA prévue dans la convention existante (avant transformation)",
};
/* Le champ a été remplacé début avril 2026 : les dossiers déposés entre le 31/03 et le
 * 01/04 portent l'ancien, supprimé depuis. Le premier renseigné l'emporte. */
const HUDA_PLACES_TRANSFEREES = [
  {
    id: "Q2hhbXAtNjM0MzY3Nw==",
    label: "Nombre total de places HUDA transformées",
  },
  {
    id: "Q2hhbXAtNjM0MTQxNQ==",
    label:
      "Nombre total de places HUDA transformées (champ retiré en avril 2026)",
  },
];

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

/* Une capacité nulle vaut une capacité absente : rien à pré-remplir. */
const parsePositiveInt = (raw: string): number | null => {
  const value = parseStrictInt(raw);
  return value !== null && value > 0 ? value : null;
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

/* Les places qui font foi pour la contraction sont celles de Bhasile, pas celles déclarées
 * dans le dossier : c'est contre elles que le formulaire valide la saisie de l'agent. */
const findHudaPlacesAutorisees = async (
  structureId: number,
  effectiveDate: Date
): Promise<number | null> => {
  const structureVersions = await prisma.structureVersion.findMany({
    where: { structureId },
    select: {
      id: true,
      effectiveDate: true,
      placesAutorisees: true,
      structureVersionTransformationId: true,
      structureVersionTransformation: {
        select: {
          transformation: { select: { form: { select: { status: true } } } },
        },
      },
    },
  });
  return (
    resolvePredecessor(structureVersions, effectiveDate)?.placesAutorisees ??
    null
  );
};

/* Le décompte doit être identique à l'import et à la relecture : s'il diverge, un dossier
 * jugé multi-HUDA à la création et mono-HUDA à la relecture serait supprimé et recréé
 * à chaque exécution. Les sections déclarées priment sur les structures résolues, qui
 * dédoublonnent (un même HUDA cité dans les deux sections ne compte qu'une fois). */
const countHudaSections = (
  dossier: HudaCadaDossierNode,
  resolvedCount: number
): number =>
  Math.max(
    resolvedCount,
    champValues(dossier, HUDA_BHASILE).length,
    champValues(dossier, HUDA_DNA).length
  );

type HudaDeparture = {
  departureType: HudaCadaDepartureType;
  remainingPlaces?: number;
  downgradeReason?: string;
};

/* Le dossier décide de contracter, Bhasile chiffre : le formulaire valide les places
 * restantes contre la version en vigueur, pas contre la capacité déclarée en DN. */
const resolveHudaDeparture = async (
  hudas: { structureId: number; codeBhasile: string }[],
  departureType: HudaCadaDepartureType,
  transferredPlaces: number | null,
  effectiveDate: Date
): Promise<HudaDeparture> => {
  if (
    departureType !== StructureVersionTransformationType.CONTRACTION ||
    transferredPlaces === null
  ) {
    return { departureType };
  }

  const [huda] = hudas;
  const placesBhasile = await findHudaPlacesAutorisees(
    huda.structureId,
    effectiveDate
  );
  if (placesBhasile === null) {
    return {
      departureType: StructureVersionTransformationType.FERMETURE,
      downgradeReason: `${huda.codeBhasile} sans places connues en base à la date d'effet`,
    };
  }

  const remainingPlaces = placesBhasile - transferredPlaces;
  if (remainingPlaces <= 0) {
    return {
      departureType: StructureVersionTransformationType.FERMETURE,
      downgradeReason: `${huda.codeBhasile} : ${transferredPlaces} places transférées pour ${placesBhasile} en base`,
    };
  }
  return { departureType, remainingPlaces };
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

  if (type === TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU) {
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
 *   issue du dossier DN pour la création). La brique fermeture n'a pas cette étape,
 *   l'updateMany ne la touche donc pas ; la brique contraction l'a, et l'import y écrit
 *   les places restantes — sans quoi l'étape serait annoncée prête et vide. */
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
const contracted: string[] = [];
const notContracted: string[] = [];
const contradicted: string[] = [];

type ImportedTransformation = {
  id: number;
  /* Une ligne en base peut encore porter un ancien nom tant que le one-off n'a pas tourné. */
  type: TransformationType | LegacyHudaTransformationType;
  form: { status: boolean } | null;
  structureVersionTransformations: {
    form: { formSteps: { status: DbStepStatus }[] } | null;
    structureVersion: {
      structureId: number | null;
      structure: { codeBhasile: string } | null;
    } | null;
  }[];
};

const UNTOUCHED_STEP_STATUSES: DbStepStatus[] = [
  StepStatus.NON_COMMENCE,
  StepStatus.PRE_REMPLI,
];

/* L'import ne pose jamais que PRE_REMPLI : tout autre statut vient d'un agent. */
const isUntouchedDraft = (transformation: ImportedTransformation): boolean =>
  transformation.structureVersionTransformations.every(
    (structureVersionTransformation) =>
      structureVersionTransformation.form?.formSteps.every((formStep) =>
        UNTOUCHED_STEP_STATUSES.includes(formStep.status)
      ) ?? true
  );

/* Une transfo déjà importée n'est jamais retypée en place : le formDefinition d'une brique
 * dépend de son type. Un brouillon intact se supprime — le flux normal le recrée dans la
 * foulée, avec l'inférence. Dès qu'un agent y a touché, on se contente de le signaler. */
const reviewImportedTransformation = async (
  dossier: HudaCadaDossierNode,
  transformation: ImportedTransformation
): Promise<void> => {
  const effectiveDate = resolveEffectiveDate(dossier);
  const existingDeparture =
    TRANSFORMATION_TYPE_SPECS[transformation.type].blocks[0]?.type;
  /* Une transfo finalisée ne peut plus être corrigée : la signaler chaque jour ouvré
   * n'apporterait qu'un rappel que personne ne peut traiter. */
  if (
    !effectiveDate ||
    !existingDeparture ||
    transformation.form?.status !== false
  ) {
    return;
  }

  const hudas = transformation.structureVersionTransformations
    .map((structureVersionTransformation) => ({
      structureId: structureVersionTransformation.structureVersion?.structureId,
      codeBhasile:
        structureVersionTransformation.structureVersion?.structure
          ?.codeBhasile ?? "",
    }))
    .filter(
      (huda): huda is { structureId: number; codeBhasile: string } =>
        huda.structureId != null
    );
  if (hudas.length === 0) {
    return;
  }

  const transferredPlaces = parseStrictInt(
    champValues(dossier, HUDA_PLACES_TRANSFEREES)[0] ?? ""
  );
  const declared = resolveHudaDepartureType({
    totalPlaces: parseStrictInt(champValue(dossier, HUDA_CAPACITE_AVANT)),
    transferredPlaces,
    hudaCount: countHudaSections(dossier, hudas.length),
  });
  /* On compare au départ définitif, pas au déclaré : sinon un dossier que Bhasile
   * rétrograde en fermeture serait supprimé et recréé à chaque exécution. */
  const { departureType } = await resolveHudaDeparture(
    hudas,
    declared.departureType,
    transferredPlaces,
    effectiveDate
  );

  if (departureType === existingDeparture) {
    return;
  }

  if (!isUntouchedDraft(transformation)) {
    contradicted.push(
      `#${dossier.number} → transfo #${transformation.id} typée ${existingDeparture}, le dossier indique ${departureType}`
    );
    return;
  }

  /* La ré-importation peut échouer sur un état de base qui a changé depuis (HUDA fermé
   * entre-temps, par exemple) : le brouillon aurait alors disparu sans remplaçant. */
  const importedBefore = imported.length;
  await prisma.transformation.delete({ where: { id: transformation.id } });
  await importDossier(dossier);
  if (imported.length === importedBefore) {
    failed.push({
      numero: dossier.number,
      reason: `transfo #${transformation.id} supprimée pour retypage mais non recréée — à ressaisir`,
    });
  }
};

/* Un dossier hors cadre ou en erreur ne doit jamais empêcher les suivants d'être importés :
 * on collecte tout et on rend compte à la fin. */
const importDossier = async (dossier: HudaCadaDossierNode): Promise<void> => {
  const skip = (reason: string) =>
    skipped.push({ numero: dossier.number, reason });

  const existing = await prisma.transformation.findUnique({
    where: { numeroDossier: String(dossier.number) },
    select: {
      id: true,
      type: true,
      form: { select: { status: true } },
      structureVersionTransformations: {
        where: {
          type: {
            in: [
              StructureVersionTransformationType.FERMETURE,
              StructureVersionTransformationType.CONTRACTION,
            ],
          },
        },
        select: {
          form: { select: { formSteps: { select: { status: true } } } },
          structureVersion: {
            select: {
              structureId: true,
              structure: { select: { codeBhasile: true } },
            },
          },
        },
      },
    },
  });
  if (existing) {
    await reviewImportedTransformation(dossier, existing);
    return;
  }

  const rawType = champValue(dossier, TYPE);
  if (isAmbiguousFusion(rawType)) {
    skip(
      "fusion d'un CADA existant : le dossier ne désigne pas le CADA à absorber"
    );
    return;
  }
  const destination = parseHudaCadaDestination(rawType);
  if (!destination) {
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

  const transferredPlaces = parseStrictInt(
    champValues(dossier, HUDA_PLACES_TRANSFEREES)[0] ?? ""
  );
  const declared = resolveHudaDepartureType({
    totalPlaces: parseStrictInt(champValue(dossier, HUDA_CAPACITE_AVANT)),
    transferredPlaces,
    hudaCount: countHudaSections(dossier, hudas.length),
  });
  const departure = await resolveHudaDeparture(
    hudas,
    declared.departureType,
    transferredPlaces,
    effectiveDate
  );

  const type = resolveHudaCadaTransformationType(
    departure.departureType,
    destination
  );
  if (!type) {
    skip(`destination ${destination} sans type de transformation`);
    return;
  }

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

  if (
    departure.departureType === StructureVersionTransformationType.CONTRACTION
  ) {
    contracted.push(
      `#${dossier.number} → ${hudas[0].codeBhasile} garde ${departure.remainingPlaces} place(s)`
    );
  }
  const notContractedReason = departure.downgradeReason ?? declared.reason;
  if (
    departure.departureType === StructureVersionTransformationType.FERMETURE &&
    notContractedReason
  ) {
    notContracted.push(`#${dossier.number} : ${notContractedReason}`);
  }

  const { structureTypologies, placesAutorisees } = buildCapacityFields(
    departure.remainingPlaces ?? null,
    effectiveDate
  );

  const id = await createTransformation(
    {
      type,
      structureVersionTransformations: [
        ...hudas.map((huda) => ({
          type: departure.departureType,
          structureTypologies,
          structureVersion: {
            structureId: huda.structureId,
            effectiveDate: effectiveDate.toISOString(),
            placesAutorisees,
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

if (contracted.length) {
  console.log(`📉 ${contracted.length} HUDA en contraction (places restantes)`);
  contracted.forEach((line) => console.log(`   ${line}`));
}

if (notContracted.length) {
  console.log(
    `📌 ${notContracted.length} dossier(s) laissés en fermeture faute de places exploitables`
  );
  notContracted.forEach((line) => console.log(`   ${line}`));
}

if (contradicted.length) {
  console.log(
    `⚠️ ${contradicted.length} transfo(s) commencée(s) par un agent que le dossier contredit`
  );
  contradicted.forEach((line) => console.log(`   ${line}`));
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
