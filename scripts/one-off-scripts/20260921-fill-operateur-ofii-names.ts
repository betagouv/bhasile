// One-off : bascule du mapping opérateurs OFII du JSON S3 vers Operateur.ofiiNames.
//
// Usage: yarn one-off 20260921-fill-operateur-ofii-names [cle_s3_du_json]

import "dotenv/config";

import { checkBucket, getObject } from "@/lib/minio";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

type OperateurMapping = Record<string, string>;
type OperateurRecord = { id: number; name: string; ofiiNames: string[] };

async function main() {
  const bucketName = process.env.DOCS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error(
      "DOCS_BUCKET_NAME doit être défini pour charger le mapping opérateurs depuis S3."
    );
  }

  const objectName =
    process.argv[2] ??
    process.env.OFII_OPERATEUR_MAPPING_KEY ??
    "operateurs_to_match.json";

  console.log(
    `🚀 Import du mapping opérateurs OFII : bucket=${bucketName}, key=${objectName}`
  );

  const mapping = await loadMappingFromS3(bucketName, objectName);
  const operateurs: OperateurRecord[] = await prisma.operateur.findMany({
    select: { id: true, name: true, ofiiNames: true },
  });

  const byName = new Map(
    operateurs.map((operateur) => [stripAndUpper(operateur.name), operateur])
  );

  const claimedBy = new Map<string, OperateurRecord>();
  for (const operateur of operateurs) {
    for (const label of [operateur.name, ...operateur.ofiiNames].map(
      stripAndUpper
    )) {
      claimedBy.set(label, operateur);
    }
  }

  const toAdd = new Map<number, string[]>();
  const unknown: string[] = [];
  const conflicts: string[] = [];
  let alreadyMapped = 0;
  let sameAsName = 0;

  for (const [rawName, normalizedName] of Object.entries(mapping)) {
    const ofiiName = stripAndUpper(rawName);
    const operateur = byName.get(stripAndUpper(normalizedName));

    if (!ofiiName) {
      continue;
    }

    if (!operateur) {
      unknown.push(`${rawName} → ${normalizedName}`);
      continue;
    }

    if (ofiiName === stripAndUpper(operateur.name)) {
      sameAsName += 1;
      continue;
    }

    const owner = claimedBy.get(ofiiName);

    if (owner?.id === operateur.id) {
      alreadyMapped += 1;
      continue;
    }

    if (owner) {
      conflicts.push(
        `${ofiiName} : déjà rattaché à ${owner.name}, demandé pour ${operateur.name}`
      );
      continue;
    }

    toAdd.set(operateur.id, [...(toAdd.get(operateur.id) ?? []), ofiiName]);
    claimedBy.set(ofiiName, operateur);
  }

  if (conflicts.length > 0) {
    conflicts.forEach((conflict) => console.log(`  - ${conflict}`));
    throw new Error(
      `${conflicts.length} libellé(s) OFII rattaché(s) à deux opérateurs : corriger le JSON avant de relancer.`
    );
  }

  for (const operateur of operateurs) {
    const labels = toAdd.get(operateur.id);
    if (!labels) {
      continue;
    }
    await prisma.operateur.update({
      where: { id: operateur.id },
      data: { ofiiNames: [...operateur.ofiiNames, ...labels] },
    });
    console.log(`  - ${operateur.name} : ${labels.join(", ")}`);
  }

  const added = [...toAdd.values()].reduce(
    (total, labels) => total + labels.length,
    0
  );

  console.log(
    `✅ ${added} libellé(s) ajouté(s) sur ${toAdd.size} opérateur(s), ${alreadyMapped} déjà en place, ${sameAsName} entrée(s) identique(s) au nom en base (aucun alias nécessaire).`
  );

  if (unknown.length > 0) {
    console.log(
      `⚠️ ${unknown.length} entrée(s) pointant vers un opérateur absent de la base :`
    );
    unknown.forEach((entry) => console.log(`  - ${entry}`));
  }
}

const stripAndUpper = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const loadMappingFromS3 = async (
  bucketName: string,
  objectName: string
): Promise<OperateurMapping> => {
  await checkBucket(bucketName);
  const stream = await getObject(bucketName, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(
    Buffer.concat(chunks).toString("utf-8")
  ) as OperateurMapping;
};

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
