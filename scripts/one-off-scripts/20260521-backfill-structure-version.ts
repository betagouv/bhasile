// @ts-nocheck
// One-off : version initiale (t0) par structure + structureVersionId sur les tables liées.
// Idempotent via slug "initial-version". Usage : yarn one-off 20260521-backfill-structure-version

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const INITIAL_VERSION_SLUG = "initial-version";

function initialVersionData(structure) {
  return {
    effectiveDate: structure.createdAt,
    shouldHistorize: true,
    type: structure.type,
    adresseAdministrative: structure.adresseAdministrative,
    codePostalAdministratif: structure.codePostalAdministratif,
    communeAdministrative: structure.communeAdministrative,
    departementAdministratif: structure.departementAdministratif,
    latitude: structure.latitude,
    longitude: structure.longitude,
    nom: structure.nom,
    debutConvention: structure.debutConvention,
    finConvention: structure.finConvention,
    creationDate: structure.creationDate,
    date303: structure.date303,
    lgbt: structure.lgbt,
    fvvTeh: structure.fvvTeh,
    public: structure.public,
    debutPeriodeAutorisation: structure.debutPeriodeAutorisation,
    finPeriodeAutorisation: structure.finPeriodeAutorisation,
    notes: structure.notes,
    nomOfii: structure.nomOfii,
    directionTerritoriale: structure.directionTerritoriale,
    operateurId: structure.operateurId,
    isArchived: false,
  };
}

async function main() {
  console.log("🚀 Backfill initial StructureVersion");

  const structures = await prisma.structure.findMany({
    orderBy: { id: "asc" },
  });

  for (const structure of structures) {
    await prisma.structureVersion.updateMany({
      where: { structureId: structure.id, slug: null },
      data: { slug: INITIAL_VERSION_SLUG, shouldHistorize: true },
    });

    const version = await prisma.structureVersion.upsert({
      where: {
        structureId_slug: {
          structureId: structure.id,
          slug: INITIAL_VERSION_SLUG,
        },
      },
      create: {
        structureId: structure.id,
        slug: INITIAL_VERSION_SLUG,
        ...initialVersionData(structure),
      },
      update: initialVersionData(structure),
    });

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
    await prisma.finess.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
    await prisma.dnaStructure.updateMany({
      where: link,
      data: { structureVersionId: version.id },
    });
  }

  console.log(`✅ Terminé (${structures.length} structures)`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur backfill StructureVersion:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
