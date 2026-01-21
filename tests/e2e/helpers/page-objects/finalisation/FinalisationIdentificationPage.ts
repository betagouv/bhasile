import { URLS } from "../../constants";
import { BasePage } from "../BasePage";

export class FinalisationIdentificationPage extends BasePage {
  async submit(structureId: number) {
    await this.submitAndWaitForUrl(
      URLS.finalisationStep(structureId, "02-documents-financiers")
    );
  }
}
