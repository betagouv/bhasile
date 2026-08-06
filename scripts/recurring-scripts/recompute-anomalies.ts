// Recalculer les anomalies de toutes les structures (alimente le tableau de bord)
// Usage: yarn script recompute-anomalies

import "dotenv/config";

import { recomputeAllAnomalies } from "@/app/api/anomalies/anomalie.service";
import prisma from "@/lib/prisma";

const run = async () => {
  try {
    console.log("🔎 Recalcul des anomalies");

    const count = await recomputeAllAnomalies();

    console.log(`Anomalies recalculées pour ${count} structures`);
  } catch (error) {
    console.error("❌ Erreur lors du recalcul des anomalies", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
