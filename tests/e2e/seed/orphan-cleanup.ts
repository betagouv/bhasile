import { E2E_PREFIX } from "../data/ids";
import { prisma } from "./prisma";

/**
 * Delete any leftover e2e records (everything with the E2E- prefix).
 * Run once at the start of the suite to avoid test pollution.
 *
 * Safe because the prefix is exclusive to this test suite — never used by
 * real data.
 *
 * Surfaces ALL failures at the end instead of swallowing them: a non-cascading
 * FK or schema regression that breaks cleanup must not silently work around
 * itself, or the test suite will see growing pollution between runs without
 * any signal.
 */
export const cleanupOrphans = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Les tests e2e ne doivent pas être exécutés en production");
  }

  const errors: string[] = [];

  // CPOMs first (cascades to CpomStructure / CpomDepartement / Budget / ActeAdministratif).
  const cpoms = await prisma.cpom.findMany({
    where: { name: { startsWith: E2E_PREFIX } },
    select: { id: true },
  });
  for (const { id } of cpoms) {
    try {
      await prisma.cpomMillesime.deleteMany({ where: { cpomId: id } });
      await prisma.cpom.deleteMany({ where: { id } });
    } catch (err) {
      errors.push(
        `cpom ${id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Structures: clear any CpomStructure links that survived (e.g. links to a
  // non-prefixed CPOM that's still around) before the structure delete, so
  // the FK on CpomStructure.structureId (no Cascade declared) doesn't block.
  const structures = await prisma.structure.findMany({
    where: { codeBhasile: { startsWith: E2E_PREFIX } },
    select: { id: true, codeBhasile: true },
  });
  for (const { id, codeBhasile } of structures) {
    try {
      await prisma.cpomStructure.deleteMany({ where: { structureId: id } });
      await prisma.structure.deleteMany({ where: { id } });
    } catch (err) {
      errors.push(
        `structure ${codeBhasile}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Orphan Dna codes (Dna is shared across structures via DnaStructure with
  // Cascade — safe to deleteMany by prefix).
  try {
    await prisma.dna.deleteMany({
      where: { code: { startsWith: E2E_PREFIX } },
    });
  } catch (err) {
    errors.push(
      `dna prefix: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Orphan Finess codes — same reason.
  try {
    await prisma.finess.deleteMany({
      where: { code: { startsWith: E2E_PREFIX } },
    });
  } catch (err) {
    errors.push(
      `finess prefix: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `cleanupOrphans left ${errors.length} record(s) behind:\n  - ${errors.join("\n  - ")}`
    );
  }
};
