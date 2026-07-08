import { StepStatus } from "@/types/form.type";

import { expect } from "../fixtures/test";
import { prisma } from "./prisma";

/**
 * Vérifie en base que l'actualisation a bien été validée de bout en bout :
 * form validé, toutes les étapes VALIDE, et le pmr saisi par l'agent persisté
 * sur la StructureVersion de la campagne.
 */
export const expectActualisationValidated = async (
  campaignId: number,
  expectedPmr: number,
  year: number
): Promise<void> => {
  const form = await prisma.form.findFirstOrThrow({
    where: { campaignId },
    include: { formSteps: true },
  });

  expect(form.status).toBe(true);
  expect(form.formSteps.length).toBeGreaterThan(0);
  expect(
    form.formSteps.every((formStep) => formStep.status === StepStatus.VALIDE)
  ).toBe(true);

  const typologie = await prisma.structureTypologie.findFirstOrThrow({
    where: { structureVersion: { campaignId }, year },
  });

  expect(typologie.pmr).toBe(expectedPmr);
};
