import { Page } from "@playwright/test";

import { isStructureAutorisee } from "@/app/utils/structure.util";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class IdentificationPage extends BasePage {
  private autocompleteHelper: AutocompleteHelper;
  private checkboxHelper: CheckboxHelper;
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.autocompleteHelper = new AutocompleteHelper(page);
    this.checkboxHelper = new CheckboxHelper(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
  }

  async fillForm(data: Partial<TestStructureData>) {
    if (data.type) {
      await this.formHelper.selectOption('select[name="type"]', data.type);
      await this.waitHelper.waitForUIUpdate();
    }

    if (data.filiale) {
      await this.formHelper.toggleSwitch(SELECTORS.FILIALE_TOGGLE, true);
      await this.waitHelper.waitForFormFieldReady(SELECTORS.FILIALE_INPUT);
      await this.formHelper.fillInput(SELECTORS.FILIALE_INPUT, data.filiale);
    }

    if (data.creationDate) {
      await this.formHelper.fillDate(
        'input[name="creationDate"]',
        data.creationDate
      );
    }

    if (data.public) {
      await this.formHelper.selectOption(SELECTORS.PUBLIC_SELECT, data.public);
    }

    if (data.lgbt) {
      await this.checkboxHelper.check('input[name="lgbt"]', { useLabel: true });
    }
    if (data.fvvTeh) {
      await this.checkboxHelper.check('input[name="fvvTeh"]', {
        useLabel: true,
      });
    }

    const defaultSecondaryContact = {
      prenom: "Jane",
      nom: "Doe",
      role: "Responsable administratif",
      email: "jane.doe@example.com",
      telephone: "+33623456789",
    };
    await this.formHelper.fillContact(
      "contacts.0",
      data.contactPrincipal ?? {}
    );
    await this.formHelper.fillContact(
      "contacts.1",
      data.contactSecondaire ?? defaultSecondaryContact
    );

    if (data.debutPeriodeAutorisation) {
      await this.formHelper.fillDate(
        'input[name="debutPeriodeAutorisation"]',
        data.debutPeriodeAutorisation
      );
    }
    if (data.finPeriodeAutorisation) {
      await this.formHelper.fillDate(
        'input[name="finPeriodeAutorisation"]',
        data.finPeriodeAutorisation
      );
    }

    if (data.debutConvention) {
      await this.formHelper.fillDate(
        'input[name="debutConvention"]',
        data.debutConvention
      );
    }
    if (data.finConvention) {
      await this.formHelper.fillDate(
        'input[name="finConvention"]',
        data.finConvention
      );
    }

    if (data.nom) {
      await this.formHelper.fillInput('input[name="nom"]', data.nom);
    }

    if (data.adresseAdministrative) {
      await this.autocompleteHelper.fillAndSelectFirst(
        SELECTORS.ADRESSE_ADMINISTRATIVE_COMPLETE,
        data.adresseAdministrative.searchTerm
      );
      await this.waitHelper.waitForUIUpdate();
    }

    const isAutorisee = isStructureAutorisee(data.type);
    const dnas = data.dnas ?? [];
    const finesses = data.finesses ?? [];

    const hasMultipleDnas = dnas.length > 1;
    const hasMultipleFinesses = isAutorisee && finesses.length > 1;
    const shouldUseMultiCodes = hasMultipleDnas || hasMultipleFinesses;

    if (shouldUseMultiCodes) {
      await this.checkboxHelper.check('input[name="isMultiDna"]', {
        useLabel: true,
      });
      await this.waitHelper.waitForUIUpdate();

      for (const [i, dna] of dnas.entries()) {
        if (i > 0) {
          await this.page
            .getByRole("button", { name: /Ajouter un code DNA/i })
            .click();
          await this.waitHelper.waitForUIUpdate();
        }
        if (dna.code) {
          await this.formHelper.fillInput(
            `input[name="dnaStructures.${i}.dna.code"]`,
            dna.code
          );
        }
        if (dna.description) {
          await this.formHelper.fillInput(
            `input[name="dnaStructures.${i}.dna.description"]`,
            dna.description
          );
        }
      }

      if (isAutorisee) {
        for (const [i, finess] of finesses.entries()) {
          if (i > 0) {
            await this.page
              .getByRole("button", { name: /Ajouter un code FINESS/i })
              .click();
            await this.waitHelper.waitForUIUpdate();
          }
          if (finess.code) {
            await this.formHelper.fillInput(
              `input[name="finesses.${i}.code"]`,
              finess.code
            );
          }
          if (finess.description) {
            await this.formHelper.fillInput(
              `input[name="finesses.${i}.description"]`,
              finess.description
            );
          }
        }
      }
    } else {
      if (dnas[0]?.code) {
        await this.formHelper.fillInput(
          'input[name="dnaStructures.0.dna.code"]',
          dnas[0].code
        );
      }
      if (isAutorisee && finesses[0]?.code) {
        await this.formHelper.fillInput(
          'input[name="finesses.0.code"]',
          finesses[0].code
        );
      }
    }

    const antennes = data.antennes ?? [];
    if (antennes.length > 0) {
      await this.checkboxHelper.check('input[name="isMultiAntenne"]', {
        useLabel: true,
      });
      await this.waitHelper.waitForUIUpdate();

      for (const [i, antenne] of antennes.entries()) {
        if (i >= 2) {
          await this.page
            .getByRole("button", { name: /Ajouter un site administratif/i })
            .click();
          await this.waitHelper.waitForUIUpdate();
        }

        if (antenne.name) {
          await this.formHelper.fillInput(
            `input[name="antennes.${i}.name"]`,
            antenne.name
          );
        }
        if (antenne.searchTerm) {
          await this.autocompleteHelper.fillAndSelectFirst(
            SELECTORS.ANTENNE_ADRESSE_COMPLETE(i),
            antenne.searchTerm
          );
          await this.waitHelper.waitForUIUpdate();
        }
      }
    }
  }

  async submit(id: string, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(URLS.ajoutStep(id, "02-adresses"));
    }
  }
}
