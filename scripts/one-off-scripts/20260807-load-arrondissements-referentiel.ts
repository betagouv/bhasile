// One-off : chargement du référentiel arrondissements / communes depuis prisma/data.
// Rejouable : les arrondissements sont upsertés, les communes remplacées.
// Usage : yarn one-off 20260807-load-arrondissements-referentiel

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { seedArrondissementsAndCommunes } from "prisma/seeders/arrondissements.seed";

const prisma = createPrismaClient();

console.log("➡️ Chargement du référentiel arrondissements / communes...");

await seedArrondissementsAndCommunes(prisma);

console.log("✅ Référentiel chargé.");

await prisma.$disconnect();
