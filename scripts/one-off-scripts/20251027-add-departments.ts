// @ts-nocheck
import { PrismaClient } from "@prisma/client";

import { DEPARTEMENTS } from "@/constants";
const prisma = new PrismaClient();

export async function addDepartments() {
  console.log("🚀 Début de l'ajout des départements...");

  for (const department of DEPARTEMENTS) {
    await prisma.departement.upsert({
      where: { numero: department.numero },
      update: {
        name: department.name,
        region: department.region,
      },
      create: {
        numero: department.numero,
        name: department.name,
        region: department.region,
      },
    });
  }

  console.log("✅ Départements ajoutés");
}

addDepartments();
