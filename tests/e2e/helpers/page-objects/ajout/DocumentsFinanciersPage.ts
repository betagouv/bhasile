import { URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class DocumentsFinanciersPage extends BasePage {
  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "ajout");
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "05-verification"));
  }
}
