// @ts-nocheck
// One-off : version initiale (t0) par structure, rattachée à une Campaign "initialisation",
// + structureVersionId sur les tables liées.
// Idempotent : réutilise la version sans transfo existante, sinon création ; garantit la Campaign.
// Usage : yarn one-off 20260521-backfill-structure-version

import "dotenv/config";

import type { Structure } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

function initialVersionData(structure: Structure) {
  return {
    structureId: structure.id,
    effectiveDate: structure.updatedAt,
    type: structure.type,
    adresseAdministrative: structure.adresseAdministrative,
    codePostalAdministratif: structure.codePostalAdministratif,
    communeAdministrative: structure.communeAdministrative,
    departementAdministratif: structure.departementAdministratif,
    latitude: structure.latitude,
    longitude: structure.longitude,
    nom: structure.nom,
    creationDate: structure.creationDate,
    date303: structure.date303,
    lgbt: structure.lgbt,
    fvvTeh: structure.fvvTeh,
    public: structure.public,
    notes: structure.notes,
    nomOfii: structure.nomOfii,
    directionTerritoriale: structure.directionTerritoriale,
  };
}

async function main() {
  console.log("🚀 Backfill initial StructureVersion");

  const structures = await prisma.structure.findMany({});

  let createdVersionsCount = 0;
  let updatedVersionsCount = 0;

  for (const structure of structures) {
    const versionData = initialVersionData(structure);

    const existing = await prisma.structureVersion.findFirst({
      where: {
        structureId: structure.id,
        structureVersionTransformationId: null,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, campaignId: true },
    });

    let version;
    if (existing) {
      const campaignId =
        existing.campaignId ??
        (await prisma.campaign.create({ data: { name: "initialisation" } })).id;
      version = await prisma.structureVersion.update({
        where: { id: existing.id },
        data: { ...versionData, campaignId },
      });
      updatedVersionsCount += 1;
    } else {
      const campaign = await prisma.campaign.create({
        data: { name: "initialisation" },
      });
      version = await prisma.structureVersion.create({
        data: { ...versionData, campaignId: campaign.id },
      });
      createdVersionsCount += 1;
    }

    const link = { structureId: structure.id, structureVersionId: null };

    await prisma.contact.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.adresse.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.structureTypologie.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.antenne.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.structureFiness.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.dnaStructure.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
  }

  console.log(
    `✅ StructureVersions : ${createdVersionsCount} créées, ${updatedVersionsCount} mises à jour (${structures.length} structures). Début des adresses…`
  );

  const adresses = await prisma.adresse.findMany({
    include: {
      adresseTypologies: {
        where: { placesAutorisees: { gt: 0 } },
        orderBy: { year: "desc" },
        take: 1,
      },
    },
  });

  for (const adresse of adresses) {
    const typologie = adresse.adresseTypologies[0];
    if (!typologie) continue;

    await prisma.adresse.update({
      where: { id: adresse.id },
      data: {
        placesAutorisees: typologie.placesAutorisees,
        qpv: typologie.qpv,
        logementSocial: typologie.logementSocial,
      },
    });
  }

  console.log(
    `✅ Terminé (${structures.length} structures, ${adresses.length} adresses)`
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur backfill StructureVersion:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
