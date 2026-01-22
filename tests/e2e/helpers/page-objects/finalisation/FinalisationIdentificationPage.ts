import { URLS } from "../../constants";
import { BasePage } from "../BasePage";

export class FinalisationIdentificationPage extends BasePage {
  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(
        URLS.finalisationStep(structureId, "02-documents-financiers")
      );
    }
  }
}
