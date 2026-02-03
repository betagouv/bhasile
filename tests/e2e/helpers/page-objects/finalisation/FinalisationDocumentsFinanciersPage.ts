import { URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class FinalisationDocumentsFinanciersPage extends BasePage {
  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "finalisation");
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(
        URLS.finalisationStep(structureId, "03-finance")
      );
    }
  }
}
