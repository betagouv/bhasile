import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetApiType } from "@/schemas/api/budget.schema";

describe("BudgetTableCommentLine", () => {
  it("affiche la ligne en lecture quand au moins une année a un commentaire", () => {
    renderLine([
      { year: 2025, commentaire: "Reprise du déficit" },
      { year: 2024, commentaire: null },
    ]);

    expect(screen.getByText("Commentaire")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voir" })).toBeInTheDocument();
  });

  it("masque la ligne en lecture quand aucun commentaire n'est renseigné", () => {
    renderLine([
      { year: 2025, commentaire: null },
      { year: 2024, commentaire: null },
    ]);

    expect(screen.queryByText("Commentaire")).not.toBeInTheDocument();
  });
});

const renderLine = (budgets: Partial<BudgetApiType>[]) =>
  render(
    <table>
      <tbody>
        <BudgetTableCommentLine
          label="Commentaire"
          years={[2025, 2024]}
          budgets={budgets as BudgetApiType[]}
          canEdit={false}
        />
      </tbody>
    </table>
  );
