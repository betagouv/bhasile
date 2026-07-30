// One-off : bascule des scalaires d'adresse depuis AdresseTypologie.
// Adresse devient la source de vérité (places, QPV, logement social) ; AdresseTypologie
// n'est plus écrite par l'app et sera supprimée dans une PR suivante.
//
// ⚠️ À lancer IMMÉDIATEMENT après le déploiement de la bascule : entre les deux, toute
//    édition d'adresse écrit dans Adresse et sera écrasée ici par son AT périmée.
// Usage: yarn one-off 20260729-backfill-adresse-scalaires

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Backfill des scalaires d'adresse depuis AdresseTypologie...");

  const adresses = await prisma.adresse.findMany({
    include: {
      adresseTypologies: {
        where: { placesAutorisees: { gt: 0 } },
        orderBy: { year: "desc" },
        take: 1,
      },
    },
  });

  let alignedCount = 0;
  let skippedCount = 0;

  for (const adresse of adresses) {
    const typologie = adresse.adresseTypologies[0];
    if (!typologie) {
      skippedCount++;
      continue;
    }

    await prisma.adresse.update({
      where: { id: adresse.id },
      data: {
        placesAutorisees: typologie.placesAutorisees,
        isQpv: typologie.qpv > 0,
        isLogementSocial: typologie.logementSocial > 0,
      },
    });
    alignedCount++;
  }

  console.log(
    `✅ ${alignedCount} adresse(s) alignée(s), ${skippedCount} sautée(s) faute d'AdresseTypologie valide (sur ${adresses.length}).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
