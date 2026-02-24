// @ts-nocheck
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function migrateContactTypes() {
  console.log("🚀 Début de la migration des Types de Contacts...");

  const contactsByStructure = await prisma.contact.findMany({
    orderBy: [{ structureDnaCode: "asc" }, { id: "asc" }],
  });
  console.log(`📊 ${contactsByStructure.length} contacts trouvés`);

  const byStructure = new Map();
  for (const contact of contactsByStructure) {
    if (!byStructure.has(contact.structureDnaCode)) {
      byStructure.set(contact.structureDnaCode, []);
    }
    byStructure.get(contact.structureDnaCode).push(contact);
  }

  let updated = 0;
  for (const contacts of byStructure.values()) {
    if (contacts[0]) {
      await prisma.contact.update({
        where: { id: contacts[0].id },
        data: { type: "PRINCIPAL" },
      });
      updated += 1;
    }
    if (contacts[1]) {
      await prisma.contact.update({
        where: { id: contacts[1].id },
        data: { type: "SECONDAIRE" },
      });
      updated += 1;
    }
    for (let i = 2; i < contacts.length; i++) {
      await prisma.contact.update({
        where: { id: contacts[i].id },
        data: { type: "AUTRE" },
      });
      updated += 1;
    }
  }

  console.log(`✅ ${updated} contacts mis à jour`);
}

migrateContactTypes()
  .catch((e) => {
    console.error("❌ Erreur en migrant les types de contacts:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("🏁 Migration des types de contacts terminée");
    await prisma.$disconnect();
  });
