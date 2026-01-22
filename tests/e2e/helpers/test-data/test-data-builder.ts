import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureData, TestStructureScenario } from "./types";

export class TestStructureDataBuilder {
  private data: Partial<TestStructureData>;

  constructor() {
    // Start with valid defaults
    this.data = {
      dnaCode: `TEST-${Date.now()}`,
      type: StructureType.CADA,
      cpom: false,
      operateur: {
        name: "Opérateur Test",
        searchTerm: "Opér",
      },
      creationDate: "2015-06-01",
      public: "Tout public",
      lgbt: false,
      fvvTeh: false,
      contactPrincipal: {
        prenom: "John",
        nom: "Doe",
        role: "Directeur·rice",
        email: "john.doe@example.com",
        telephone: "+33123456789",
      },
      adresseAdministrative: {
        complete: "1 Rue de la Paix 75001 Paris",
        searchTerm: "1 Rue de la Paix 75001 Paris",
      },
      departementAdministratif: "75",
      typeBati: Repartition.COLLECTIF,
      sameAddress: true,
      adresses: [],
      structureTypologies: [
        { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
      ],
      documentsFinanciers: {
        allAddedViaAjout: true,
        files: [],
      },
    };
  }

  /**
   * Create a builder based on an existing test scenario
   * Deep clones the scenario data to avoid mutations
   */
  static basedOn(scenario: TestStructureScenario): TestStructureDataBuilder {
    const builder = new TestStructureDataBuilder();
    builder.data = JSON.parse(JSON.stringify(scenario.formData));
    return builder;
  }

  // Fluent API methods for building
  withDnaCode(dnaCode: string): this {
    this.data.dnaCode = dnaCode;
    return this;
  }

  withType(type: StructureType): this {
    this.data.type = type;
    return this;
  }

  withCreationDate(date: string): this {
    this.data.creationDate = date;
    return this;
  }

  withPublic(publicValue: string): this {
    this.data.public = publicValue;
    return this;
  }

  withContactPrincipal(contact: TestStructureData["contactPrincipal"]): this {
    this.data.contactPrincipal = contact;
    return this;
  }

  withContactPrincipalEmail(email: string): this {
    if (!this.data.contactPrincipal) {
      throw new Error(
        "Cannot set email: contactPrincipal must exist. Use withContactPrincipal() first."
      );
    }
    this.data.contactPrincipal = {
      ...this.data.contactPrincipal,
      email,
    };
    return this;
  }

  withContactPrincipalPhone(telephone: string): this {
    if (!this.data.contactPrincipal) {
      throw new Error(
        "Cannot set phone: contactPrincipal must exist. Use withContactPrincipal() first."
      );
    }
    this.data.contactPrincipal = {
      ...this.data.contactPrincipal,
      telephone,
    };
    return this;
  }

  withFiliale(filiale: string): this {
    this.data.filiale = filiale;
    return this;
  }

  withFinessCode(finessCode: string): this {
    this.data.finessCode = finessCode;
    return this;
  }

  withAdresseAdministrative(address: {
    complete: string;
    searchTerm: string;
  }): this {
    this.data.adresseAdministrative = address;
    return this;
  }

  withTypeBati(typeBati: Repartition): this {
    this.data.typeBati = typeBati;
    return this;
  }

  withPeriodeAutorisation(debut: string, fin: string): this {
    this.data.debutPeriodeAutorisation = debut;
    this.data.finPeriodeAutorisation = fin;
    return this;
  }

  withConvention(debut: string, fin: string): this {
    this.data.debutConvention = debut;
    this.data.finConvention = fin;
    return this;
  }

  /**
   * Generic field modification
   */
  withField<K extends keyof TestStructureData>(
    field: K,
    value: TestStructureData[K]
  ): this {
    this.data[field] = value;
    return this;
  }

  /**
   * Remove a field
   */
  withoutField(field: keyof TestStructureData): this {
    delete this.data[field];
    return this;
  }

  /**
   * Remove multiple fields at once
   */
  withoutFields(...fields: Array<keyof TestStructureData>): this {
    fields.forEach((field) => delete this.data[field]);
    return this;
  }

  /**
   * Replace structure typologies array entirely
   */
  withStructureTypologies(
    typologies: TestStructureData["structureTypologies"]
  ): this {
    this.data.structureTypologies = typologies;
    return this;
  }

  /**
   * Replace addresses array entirely
   */
  withAdresses(adresses: TestStructureData["adresses"]): this {
    this.data.adresses = adresses;
    return this;
  }

  /**
   * Replace evaluations array entirely
   */
  withEvaluations(evaluations: TestStructureData["evaluations"]): this {
    this.data.evaluations = evaluations;
    return this;
  }

  /**
   * Replace controles array entirely
   */
  withControles(controles: TestStructureData["controles"]): this {
    this.data.controles = controles;
    return this;
  }

  /**
   * Replace documents financiers entirely
   */
  withDocumentsFinanciers(
    documents: TestStructureData["documentsFinanciers"]
  ): this {
    this.data.documentsFinanciers = documents;
    return this;
  }

  /**
   * Replace operateur entirely
   */
  withOperateur(operateur: TestStructureData["operateur"]): this {
    this.data.operateur = operateur;
    return this;
  }

  /**
   * Quick invalid value setters
   */
  withInvalidEmail(): this {
    return this.withContactPrincipalEmail("invalid-email");
  }

  withInvalidDate(): this {
    return this.withCreationDate("invalid-date");
  }

  withInvalidPhone(): this {
    return this.withContactPrincipalPhone("123");
  }

  withEmptyEmail(): this {
    return this.withContactPrincipalEmail("");
  }

  withEmptyPhone(): this {
    return this.withContactPrincipalPhone("");
  }

  /**
   * Clone builder for variations
   */
  clone(): TestStructureDataBuilder {
    const builder = new TestStructureDataBuilder();
    builder.data = JSON.parse(JSON.stringify(this.data));
    return builder;
  }

  /**
   * Build the test data
   * Returns Partial<TestStructureData> to allow missing required fields for invalid scenarios
   */
  build(): Partial<TestStructureData> {
    return { ...this.data };
  }

  // Static factory methods for common scenarios
  static createValid(): TestStructureDataBuilder {
    return new TestStructureDataBuilder();
  }

  static createMinimal(): TestStructureDataBuilder {
    return new TestStructureDataBuilder()
      .withDnaCode("TEST-MINIMAL")
      .withType(StructureType.CADA);
  }

  static createInvalid(): TestStructureDataBuilder {
    return new TestStructureDataBuilder();
  }

  // Preset builders for common types
  static forCADA(): TestStructureDataBuilder {
    return new TestStructureDataBuilder()
      .withType(StructureType.CADA)
      .withFinessCode("123456789")
      .withPeriodeAutorisation("2020-01-01", "2025-12-31");
  }

  static forCAES(): TestStructureDataBuilder {
    return new TestStructureDataBuilder()
      .withType(StructureType.CAES)
      .withConvention("2020-01-01", "2023-12-31");
  }

  static forCPH(): TestStructureDataBuilder {
    return new TestStructureDataBuilder().withType(StructureType.CPH);
  }

  static forHUDA(): TestStructureDataBuilder {
    return new TestStructureDataBuilder().withType(StructureType.HUDA);
  }
}
