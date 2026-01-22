import { URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class FinalisationDocumentsFinanciersPage extends BasePage {
  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "finalisation");
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(
      URLS.finalisationStep(structureId, "03-finance")
    );
  }
}
