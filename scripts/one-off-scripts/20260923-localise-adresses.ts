// One-off rejouable : pose le centre de commune (BAN) sur les adresses d'hébergement qui n'en ont pas.
// Ne traite que `communeLatitude IS NULL` : une relance ne reprend que les adresses encore non localisées
// (commune introuvable ou échec BAN pendant l'exécution précédente).
// Usage: yarn one-off 20260923-localise-adresses

import "dotenv/config";

import { resolveCommuneCoordinates } from "@/app/api/adresses/ban.service";
import prisma from "@/lib/prisma";

const TOP_NON_LOCALISEES_COUNT = 50;
// La BAN limite à 50 requêtes/s par IP, partagée avec l'application : on en garde la moitié.
const BAN_BATCH_SIZE = 25;
const BAN_BATCH_PAUSE_MS = 1_000;

const localiseAdresses = async (): Promise<void> => {
  const couples = await prisma.adresse.groupBy({
    by: ["codePostal", "commune"],
    where: { communeLatitude: null },
    _count: { _all: true },
  });
  console.log(
    `🔎 ${couples.length} couples (code postal, commune) à localiser`
  );

  const localisedCouples = [];
  for (let start = 0; start < couples.length; start += BAN_BATCH_SIZE) {
    if (start > 0) {
      await new Promise((resolve) => setTimeout(resolve, BAN_BATCH_PAUSE_MS));
    }
    localisedCouples.push(
      ...(await resolveCommuneCoordinates(
        couples.slice(start, start + BAN_BATCH_SIZE)
      ))
    );
  }

  let localisedCount = 0;
  const nonLocalisees: typeof localisedCouples = [];
  for (const couple of localisedCouples) {
    if (!couple.communeCoordinates) {
      nonLocalisees.push(couple);
      continue;
    }
    const { count } = await prisma.adresse.updateMany({
      where: {
        codePostal: couple.codePostal,
        commune: couple.commune,
        communeLatitude: null,
      },
      data: {
        communeLatitude: couple.communeCoordinates.latitude,
        communeLongitude: couple.communeCoordinates.longitude,
        communeNom: couple.communeCoordinates.nom,
      },
    });
    localisedCount += count;
  }

  const nonLocaliseesCount = nonLocalisees.reduce(
    (total, couple) => total + couple._count._all,
    0
  );
  console.log(
    `✅ ${localisedCount} adresses localisées, ${nonLocaliseesCount} non localisées`
  );
  console.log(
    `❓ Top ${TOP_NON_LOCALISEES_COUNT} des saisies non localisées :`
  );
  for (const couple of nonLocalisees
    .sort((first, second) => second._count._all - first._count._all)
    .slice(0, TOP_NON_LOCALISEES_COUNT)) {
    console.log(
      `   ${String(couple._count._all).padStart(4)} × ${couple.codePostal ?? "?"} ${couple.commune ?? "?"}`
    );
  }
  console.log(
    "ℹ️ Lancer ensuite `yarn script recompute-anomalies` pour mettre à jour ADRESSE_NON_LOCALISEE."
  );
};

localiseAdresses()
  .catch((error) => {
    console.error("❌ Erreur pendant la localisation des adresses :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
