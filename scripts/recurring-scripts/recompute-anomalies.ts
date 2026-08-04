// Recalculer les anomalies de toutes les structures (alimente le tableau de bord)
// Usage: yarn script recompute-anomalies

import "dotenv/config";

import { recalculerToutesLesAnomalies } from "@/app/api/anomalies/anomalie.service";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const run = async () => {
  try {
    console.log("🔎 Recalcul des anomalies");

    const count = await recalculerToutesLesAnomalies();

    console.log(`Anomalies recalculées pour ${count} structures`);
  } catch (error) {
    console.error("❌ Erreur lors du recalcul des anomalies", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
