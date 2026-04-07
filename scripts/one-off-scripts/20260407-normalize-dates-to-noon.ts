// One-off script: normalize various DateTime columns to 12:00:00. Shift +2h first so 22h/23h becomes J+1 at 12:00:00.
// Usage: yarn one-off 20260407-normalize-dates-to-noon

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

function normalizeDateRequired(date: Date): Date {
  const shiftedDate = new Date(date.getTime() + 2 * 60 * 60 * 1000 + 1); // d 22:00+ -> d+1 ; +1ms to avoid limit issue
  return new Date(
    Date.UTC(
      shiftedDate.getUTCFullYear(),
      shiftedDate.getUTCMonth(),
      shiftedDate.getUTCDate(),
      12,
      0,
      0,
      0
    )
  );
}

function normalizeDateOptional(
  date: Date | null | undefined
): Date | undefined {
  if (date == null) return undefined;
  return normalizeDateRequired(date);
}

async function main() {
  console.log("🚀 Début de la normalisation des dates (12:00:00)...");

  console.log("📥 ActeAdministratif...");
  const actes = await prisma.acteAdministratif.findMany({
    where: {
      OR: [
        { date: { not: null } },
        { startDate: { not: null } },
        { endDate: { not: null } },
      ],
    },
    select: { id: true, date: true, startDate: true, endDate: true },
    orderBy: { id: "asc" },
  });
  let updatedActe = 0;
  let errorsActe = 0;
  for (const acte of actes) {
    try {
      await prisma.acteAdministratif.update({
        where: { id: acte.id },
        data: {
          date: normalizeDateOptional(acte.date),
          startDate: normalizeDateOptional(acte.startDate),
          endDate: normalizeDateOptional(acte.endDate),
        },
      });
      updatedActe += 1;
    } catch (error) {
      errorsActe += 1;
      console.error(`❌ ActeAdministratif id=${acte.id}:`, error);
    }
  }
  console.log(
    `✅ ActeAdministratif: ${updatedActe}/${actes.length} lignes mises à jour${errorsActe ? `, ${errorsActe} erreurs` : ""}.`
  );

  console.log("📥 Activite...");
  const activites = await prisma.activite.findMany({
    select: { id: true, date: true },
    orderBy: { id: "asc" },
  });
  let updatedActivite = 0;
  let errorsActivite = 0;
  for (const activite of activites) {
    try {
      await prisma.activite.update({
        where: { id: activite.id },
        data: { date: normalizeDateRequired(activite.date) },
      });
      updatedActivite += 1;
    } catch (error) {
      errorsActivite += 1;
      console.error(`❌ Activite id=${activite.id}:`, error);
    }
  }
  console.log(
    `✅ Activite: ${updatedActivite}/${activites.length} lignes mises à jour${errorsActivite ? `, ${errorsActivite} erreurs` : ""}.`
  );

  console.log("📥 Controle...");
  const controles = await prisma.controle.findMany({
    select: { id: true, date: true },
    orderBy: { id: "asc" },
  });
  let updatedControle = 0;
  let errorsControle = 0;
  for (const controle of controles) {
    try {
      await prisma.controle.update({
        where: { id: controle.id },
        data: { date: normalizeDateRequired(controle.date) },
      });
      updatedControle += 1;
    } catch (error) {
      errorsControle += 1;
      console.error(`❌ Controle id=${controle.id}:`, error);
    }
  }
  console.log(
    `✅ Controle: ${updatedControle}/${controles.length} lignes mises à jour${errorsControle ? `, ${errorsControle} erreurs` : ""}.`
  );

  console.log("📥 CpomStructure...");
  const cpomStructures = await prisma.cpomStructure.findMany({
    where: { OR: [{ dateStart: { not: null } }, { dateEnd: { not: null } }] },
    select: { id: true, dateStart: true, dateEnd: true },
    orderBy: { id: "asc" },
  });
  let updatedCpomStructure = 0;
  let errorsCpomStructure = 0;
  for (const cs of cpomStructures) {
    try {
      await prisma.cpomStructure.update({
        where: { id: cs.id },
        data: {
          dateStart: normalizeDateOptional(cs.dateStart),
          dateEnd: normalizeDateOptional(cs.dateEnd),
        },
      });
      updatedCpomStructure += 1;
    } catch (error) {
      errorsCpomStructure += 1;
      console.error(`❌ CpomStructure id=${cs.id}:`, error);
    }
  }
  console.log(
    `✅ CpomStructure: ${updatedCpomStructure}/${cpomStructures.length} lignes mises à jour${errorsCpomStructure ? `, ${errorsCpomStructure} erreurs` : ""}.`
  );

  console.log("📥 Dna...");
  const dnas = await prisma.dna.findMany({
    where: {
      OR: [
        { activeInOfiiFileSince: { not: null } },
        { inactiveInOfiiFileSince: { not: null } },
      ],
    },
    select: {
      id: true,
      activeInOfiiFileSince: true,
      inactiveInOfiiFileSince: true,
    },
    orderBy: { id: "asc" },
  });
  let updatedDna = 0;
  let errorsDna = 0;
  for (const dna of dnas) {
    try {
      await prisma.dna.update({
        where: { id: dna.id },
        data: {
          activeInOfiiFileSince: normalizeDateOptional(
            dna.activeInOfiiFileSince
          ),
          inactiveInOfiiFileSince: normalizeDateOptional(
            dna.inactiveInOfiiFileSince
          ),
        },
      });
      updatedDna += 1;
    } catch (error) {
      errorsDna += 1;
      console.error(`❌ Dna id=${dna.id}:`, error);
    }
  }
  console.log(
    `✅ Dna: ${updatedDna}/${dnas.length} lignes mises à jour${errorsDna ? `, ${errorsDna} erreurs` : ""}.`
  );

  console.log("📥 DnaStructure...");
  const dnaStructures = await prisma.dnaStructure.findMany({
    where: { OR: [{ startDate: { not: null } }, { endDate: { not: null } }] },
    select: { id: true, startDate: true, endDate: true },
    orderBy: { id: "asc" },
  });
  let updatedDnaStructure = 0;
  let errorsDnaStructure = 0;
  for (const ds of dnaStructures) {
    try {
      await prisma.dnaStructure.update({
        where: { id: ds.id },
        data: {
          startDate: normalizeDateOptional(ds.startDate),
          endDate: normalizeDateOptional(ds.endDate),
        },
      });
      updatedDnaStructure += 1;
    } catch (error) {
      errorsDnaStructure += 1;
      console.error(`❌ DnaStructure id=${ds.id}:`, error);
    }
  }
  console.log(
    `✅ DnaStructure: ${updatedDnaStructure}/${dnaStructures.length} lignes mises à jour${errorsDnaStructure ? `, ${errorsDnaStructure} erreurs` : ""}.`
  );

  console.log("📥 Evaluation...");
  const evaluations = await prisma.evaluation.findMany({
    where: { date: { not: null } },
    select: { id: true, date: true },
    orderBy: { id: "asc" },
  });
  let updatedEvaluation = 0;
  let errorsEvaluation = 0;
  for (const evaluation of evaluations) {
    try {
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { date: normalizeDateOptional(evaluation.date) },
      });
      updatedEvaluation += 1;
    } catch (error) {
      errorsEvaluation += 1;
      console.error(`❌ Evaluation id=${evaluation.id}:`, error);
    }
  }
  console.log(
    `✅ Evaluation: ${updatedEvaluation}/${evaluations.length} lignes mises à jour${errorsEvaluation ? `, ${errorsEvaluation} erreurs` : ""}.`
  );

  console.log("📥 EIG...");
  const eigs = await prisma.evenementIndesirableGrave.findMany({
    select: { id: true, evenementDate: true, declarationDate: true },
    orderBy: { id: "asc" },
  });
  let updatedEig = 0;
  let errorsEig = 0;
  for (const eig of eigs) {
    try {
      await prisma.evenementIndesirableGrave.update({
        where: { id: eig.id },
        data: {
          evenementDate: normalizeDateRequired(eig.evenementDate),
          declarationDate: normalizeDateRequired(eig.declarationDate),
        },
      });
      updatedEig += 1;
    } catch (error) {
      errorsEig += 1;
      console.error(`❌ EIG id=${eig.id}:`, error);
    }
  }
  console.log(
    `✅ EIG: ${updatedEig}/${eigs.length} lignes mises à jour${errorsEig ? `, ${errorsEig} erreurs` : ""}.`
  );

  console.log("📥 Structure...");
  const structures = await prisma.structure.findMany({
    where: {
      OR: [
        { debutConvention: { not: null } },
        { finConvention: { not: null } },
        { creationDate: { not: null } },
        { debutPeriodeAutorisation: { not: null } },
        { finPeriodeAutorisation: { not: null } },
        { date303: { not: null } },
      ],
    },
    select: {
      id: true,
      debutConvention: true,
      finConvention: true,
      creationDate: true,
      debutPeriodeAutorisation: true,
      finPeriodeAutorisation: true,
      date303: true,
    },
    orderBy: { id: "asc" },
  });
  let updatedStructure = 0;
  let errorsStructure = 0;
  for (const structure of structures) {
    try {
      await prisma.structure.update({
        where: { id: structure.id },
        data: {
          debutConvention: normalizeDateOptional(structure.debutConvention),
          finConvention: normalizeDateOptional(structure.finConvention),
          creationDate: normalizeDateOptional(structure.creationDate),
          debutPeriodeAutorisation: normalizeDateOptional(
            structure.debutPeriodeAutorisation
          ),
          finPeriodeAutorisation: normalizeDateOptional(
            structure.finPeriodeAutorisation
          ),
          date303: normalizeDateOptional(structure.date303),
        },
      });
      updatedStructure += 1;
    } catch (error) {
      errorsStructure += 1;
      console.error(`❌ Structure id=${structure.id}:`, error);
    }
  }
  console.log(
    `✅ Structure: ${updatedStructure}/${structures.length} lignes mises à jour${errorsStructure ? `, ${errorsStructure} erreurs` : ""}.`
  );

  console.log("📥 StructureTypologie...");
  const typologies = await prisma.structureTypologie.findMany({
    where: {
      OR: [
        { echeancePlacesACreer: { not: null } },
        { echeancePlacesAFermer: { not: null } },
      ],
    },
    select: {
      id: true,
      echeancePlacesACreer: true,
      echeancePlacesAFermer: true,
    },
    orderBy: { id: "asc" },
  });
  let updatedTypologie = 0;
  let errorsTypologie = 0;
  for (const typologie of typologies) {
    try {
      await prisma.structureTypologie.update({
        where: { id: typologie.id },
        data: {
          echeancePlacesACreer: normalizeDateOptional(
            typologie.echeancePlacesACreer
          ),
          echeancePlacesAFermer: normalizeDateOptional(
            typologie.echeancePlacesAFermer
          ),
        },
      });
      updatedTypologie += 1;
    } catch (error) {
      errorsTypologie += 1;
      console.error(`❌ StructureTypologie id=${typologie.id}:`, error);
    }
  }
  console.log(
    `✅ StructureTypologie: ${updatedTypologie}/${typologies.length} lignes mises à jour${errorsTypologie ? `, ${errorsTypologie} erreurs` : ""}.`
  );

  console.log("Terminé.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant la normalisation des dates :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
