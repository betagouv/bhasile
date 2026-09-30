// One-off rejouable : pose le centre de commune (BAN) sur les adresses d'hébergement qui n'en ont pas.
// Ne traite que `communeLatitude IS NULL` : une relance ne reprend que les adresses encore non localisées
// (commune introuvable ou échec BAN pendant l'exécution précédente).
// Usage: yarn one-off 20260923-locate-adresses

import "dotenv/config";

import { resolveCommuneCoordinates } from "@/app/api/adresses/ban.service";
import prisma from "@/lib/prisma";

const TOP_NON_LOCALISEES_COUNT = 50;

const locateAdresses = async (): Promise<void> => {
  const couples = await prisma.adresse.groupBy({
    by: ["codePostal", "commune"],
    where: { communeLatitude: null },
    _count: { _all: true },
  });
  console.log(
    `🔎 ${couples.length} couples (code postal, commune) à localiser`
  );

  const locatedCouples = await resolveCommuneCoordinates(couples);

  let locatedCount = 0;
  const nonLocalisees: typeof locatedCouples = [];
  for (const couple of locatedCouples) {
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
        communeGeocodee: couple.communeCoordinates.nom,
      },
    });
    locatedCount += count;
  }

  const nonLocaliseesCount = nonLocalisees.reduce(
    (total, couple) => total + couple._count._all,
    0
  );
  console.log(
    `✅ ${locatedCount} adresses localisées, ${nonLocaliseesCount} non localisées`
  );
  console.log(
    `❓ Top ${TOP_NON_LOCALISEES_COUNT} des saisies non localisées :`
  );
  const topNonLocalisees = nonLocalisees
    .sort((first, second) => second._count._all - first._count._all)
    .slice(0, TOP_NON_LOCALISEES_COUNT);
  for (const couple of topNonLocalisees) {
    console.log(
      `   ${String(couple._count._all).padStart(4)} × ${couple.codePostal ?? "?"} ${couple.commune ?? "?"}`
    );
  }
  console.log(
    "ℹ️ Lancer ensuite `yarn script recompute-anomalies` pour mettre à jour ADRESSE_NON_LOCALISEE."
  );
};

locateAdresses()
  .catch((error) => {
    console.error("❌ Erreur pendant la localisation des adresses :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
