import { defineRegle } from "@/lib/anomalies/anomalie.regle";
import { budgetsPertinents, resultatNet } from "@/lib/anomalies/anomalie.util";
import { ANOMALIE_TARGET_STRUCTURE } from "@/types/anomalie.type";

export const REGLES_FINANCE = [
  defineRegle({
    code: "RESULTAT_NET_EQ_0",
    requiert: ["structure", "budgets"],
    evalue: ({ structure, budgets }, { anneeCourante }) =>
      budgetsPertinents(budgets, structure, anneeCourante)
        .filter((budget) => resultatNet(budget) === 0)
        .map((budget) => ({
          year: budget.year,
          targetId: ANOMALIE_TARGET_STRUCTURE,
        })),
  }),
];
