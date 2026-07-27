import { PrismaClient } from "@/generated/prisma/client";

// Ordre : enfants avant parents. En flux `prasd` la base est déjà vidée par le
// reset, mais cet ordre permet aussi un re-seed direct (`prisma db seed`) sur
// une base peuplée sans violer de contrainte de clé étrangère.
export const wipeTables = async (prisma: PrismaClient) => {
  await prisma.rmu.deleteMany({});
  await prisma.adresseTypologie.deleteMany({});
  await prisma.adresse.deleteMany({});
  await prisma.controle.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.evenementIndesirableGrave.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.structureTypologie.deleteMany({});
  await prisma.activite.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.structureMillesime.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.userAction.deleteMany({});
  await prisma.cpomStructure.deleteMany({});
  await prisma.cpom.deleteMany({});
  await prisma.antenne.deleteMany({});
  await prisma.structureFiness.deleteMany({});
  await prisma.dnaStructure.deleteMany({});
  await prisma.finess.deleteMany({});
  await prisma.dna.deleteMany({});
  await prisma.structureVersion.deleteMany({});
  await prisma.structureVersionTransformation.deleteMany({});
  await prisma.transformation.deleteMany({});
  await prisma.formStep.deleteMany({});
  await prisma.form.deleteMany({});
  await prisma.formStepDefinition.deleteMany({});
  await prisma.formDefinition.deleteMany({});
  await prisma.structure.deleteMany({});
  await prisma.operateur.deleteMany({});
  await prisma.emailPattern.deleteMany({});
  await prisma.roleDepartement.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.departement.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.campaignDefinition.deleteMany({});
  await prisma.region.deleteMany({});
};
