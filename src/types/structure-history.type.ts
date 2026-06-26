export type StructureRef = {
  id: number;
  codeBhasile: string;
};

export type CpomRef = {
  id: number;
  operateurName: string;
  departements: string[];
};

export type HistoryEvent =
  | { kind: "CREATION"; date: string; sources: StructureRef[] }
  | { kind: "EXTENSION"; date: string; sources: StructureRef[] }
  | { kind: "CONTRACTION"; date: string; targets: StructureRef[] }
  | {
      kind: "FERMETURE";
      date: string;
      targets: StructureRef[];
      motif: string | null;
    }
  | { kind: "CPOM_ENTRY"; date: string; cpom: CpomRef }
  | { kind: "CPOM_EXIT"; date: string; cpom: CpomRef };

export type HistoryEventKind = HistoryEvent["kind"];
