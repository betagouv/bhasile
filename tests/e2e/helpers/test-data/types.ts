import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { Repartition } from "@/types/adresse.type";
import { ControleType } from "@/types/controle.type";
import { StructureType } from "@/types/structure.type";

export type TestStructureData = {
  dnaCode: string;
  type: StructureType;
  cpom: boolean;
  filiale?: string;
  operateur: {
    name: string;
    searchTerm: string;
    id: number;
  };
  creationDate: string;
  finessCode?: string;
  public: string;
  lgbt: boolean;
  fvvTeh: boolean;
  contactPrincipal: {
    prenom: string;
    nom: string;
    role: string;
    email: string;
    telephone: string;
  };
  contactSecondaire?: {
    prenom: string;
    nom: string;
    role: string;
    email: string;
    telephone: string;
  };
  debutPeriodeAutorisation?: string;
  finPeriodeAutorisation?: string;
  debutConvention?: string;
  finConvention?: string;
  debutCpom?: string;
  finCpom?: string;

  nom?: string;
  adresseAdministrative: {
    complete: string;
    searchTerm: string;
  };
  departementAdministratif: string;
  typeBati: Repartition;
  sameAddress: boolean;
  adresses?: Array<{
    adresseComplete: string;
    searchTerm: string;
    placesAutorisees: number;
    repartition?: Repartition;
  }>;
  structureTypologies: Array<{
    placesAutorisees: number;
    pmr: number;
    lgbt: number;
    fvvTeh: number;
  }>;
  documentsFinanciers: {
    allAddedViaAjout: boolean;
    fileUploads: Array<{
      year: string;
      category: string;
      fileName: string;
      filePath: string;
      formKind: "ajout" | "finalisation";
    }>;
  };
  finances?: Record<number, FinanceYearData>;
  evaluations?: EvaluationData[];
  controles?: ControleData[];
  ouvertureFermeture?: OuvertureFermetureData;
  actesAdministratifs?: ActeAdministratifData[];
  finalisationNotes?: string;
};

export type FinanceValue = number | string;

export type FinanceYearData = {
  ETP?: FinanceValue;
  tauxEncadrement?: FinanceValue;
  coutJournalier?: FinanceValue;
  dotationDemandee?: FinanceValue;
  dotationAccordee?: FinanceValue;
  totalProduitsProposes?: FinanceValue;
  totalProduits?: FinanceValue;
  totalChargesProposees?: FinanceValue;
  totalCharges?: FinanceValue;
  repriseEtat?: FinanceValue;
  excedentRecupere?: FinanceValue;
  excedentDeduit?: FinanceValue;
  affectationReservesFondsDedies?: FinanceValue;
  fondsDedies?: FinanceValue;
  reserveInvestissement?: FinanceValue;
  chargesNonReconductibles?: FinanceValue;
  reserveCompensationDeficits?: FinanceValue;
  reserveCompensationBFR?: FinanceValue;
  reserveCompensationAmortissements?: FinanceValue;
  reportANouveau?: FinanceValue;
  autre?: FinanceValue;
};

export type EvaluationData = {
  date: string;
  notePersonne?: FinanceValue;
  notePro?: FinanceValue;
  noteStructure?: FinanceValue;
  note?: FinanceValue;
  filePath?: string;
  planActionFilePath?: string;
};

export type ControleData = {
  date: string;
  type: ControleType[number];
  filePath?: string;
};

export type OuvertureFermetureData = {
  placesACreer?: FinanceValue;
  echeancePlacesACreer?: string;
  placesAFermer?: FinanceValue;
  echeancePlacesAFermer?: string;
};

export type ActeAdministratifData = {
  category: ActeAdministratifCategory[number];
  filePath: string;
  startDate?: string;
  endDate?: string;
  name?: string;
};

export type FailingStep =
  | "identification"
  | "adresses"
  | "type-places"
  | "documents"
  | "verification"
  | "finalisationIdentification"
  | "finalisationDocumentsFinanciers"
  | "finalisationFinance"
  | "finalisationControles"
  | "finalisationDocuments"
  | "finalisationNotes";

export type TestStructureScenario = {
  name: string;
  formData: TestStructureData | Partial<TestStructureData>;
  failingStep?: FailingStep;
};
