import { getActualisationFormSlug } from "@/app/api/forms/form.constants";
import { StepStatus } from "@/types/form.type";

import { expect } from "../fixtures/test";
import { prisma } from "./prisma";

/**
 * Vérifie en base que l'actualisation a bien été validée de bout en bout :
 * form validé, toutes les étapes VALIDE, et le pmr saisi par l'agent persisté
 * sur la StructureTypologie de la structure (dé-versionnée).
 */
export const expectActualisationValidated = async (
  structureId: number,
  expectedPmr: number,
  year: number
): Promise<void> => {
  const form = await prisma.form.findFirstOrThrow({
    where: {
      structureId,
      formDefinition: { slug: getActualisationFormSlug(year) },
    },
    include: { formSteps: true },
  });

  expect(form.status).toBe(true);
  expect(form.formSteps.length).toBeGreaterThan(0);
  expect(
    form.formSteps.every((formStep) => formStep.status === StepStatus.VALIDE)
  ).toBe(true);

  const typologie = await prisma.structureTypologie.findFirstOrThrow({
    where: { structureId, year },
  });

  expect(typologie.pmr).toBe(expectedPmr);
};
