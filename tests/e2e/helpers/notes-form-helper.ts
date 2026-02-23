import { FormHelper } from "./form-helper";

/**
 * Fills the notes textarea. Used by both ModificationNotesPage and FinalisationNotesPage.
 */
export async function fillNotesForm(
  formHelper: FormHelper,
  notes?: string
): Promise<void> {
  if (notes) {
    await formHelper.fillInput('textarea[name="notes"]', notes);
  }
}
