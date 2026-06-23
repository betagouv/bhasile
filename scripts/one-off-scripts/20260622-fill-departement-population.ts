// One-off : remplissage population départements depuis constants.ts
// Post-migration : 20260608102330_add_population_to_department
// Usage : yarn one-off 20260622-fill-departement-population

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { DEPARTEMENTS } from "@/constants";

const prisma = createPrismaClient();

console.log("➡️ Remplissage des populations par département...");

await prisma.$transaction(
  DEPARTEMENTS.map((department) =>
    prisma.departement.updateMany({
      where: { numero: department.numero },
      data: { population: department.population },
    })
  )
);

console.log("✅ Remplissage des populations terminé.");

await prisma.$disconnect();
