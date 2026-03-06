import { FailingStep } from "./test-data/types";

/**
 * Interface for a finalisation step page object.
 * fillForm is optional (e.g. identification step has no form to fill).
 */
export interface FinalisationStepPage<TData = unknown> {
  waitForLoad(): Promise<void>;
  fillForm?(data: TData): Promise<void>;
  submit(structureId: number, expectValidationFailure?: boolean): Promise<void>;
}

/**
 * Interface for a modification step page object.
 */
export interface ModificationStepPage<TData = unknown> {
  waitForLoad(): Promise<void>;
  fillForm(data: TData): Promise<void>;
  submit(structureId: number): Promise<void>;
}

/**
 * Runs a finalisation step: wait for load, optionally fill form, submit.
 * Returns true if the flow should continue, false if it should stop (validation failure).
 */
export async function runFinalisationStep<TData>(
  stepPage: FinalisationStepPage<TData>,
  structureId: number,
  formData: TData,
  failingStep: FailingStep | undefined,
  stepKey: FailingStep
): Promise<boolean> {
  await stepPage.waitForLoad();
  if (stepPage.fillForm) {
    await stepPage.fillForm(formData);
  }
  const expectValidationFailure = failingStep === stepKey;
  await stepPage.submit(structureId, expectValidationFailure);
  return !expectValidationFailure;
}

/**
 * Runs a modification step: open edit, wait for load, fill form, submit.
 * Used by both finalisation and modification flows for the shared form pattern.
 */
export async function runModificationStep<TData>(
  openEdit: () => Promise<void>,
  modificationPage: ModificationStepPage<TData>,
  structurePage: { waitForLoad(): Promise<void> },
  structureId: number,
  formData: TData
): Promise<void> {
  await openEdit();
  await modificationPage.waitForLoad();
  await modificationPage.fillForm(formData);
  await modificationPage.submit(structureId);
  await structurePage.waitForLoad();
}
