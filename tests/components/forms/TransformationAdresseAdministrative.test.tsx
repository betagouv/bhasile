import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const mockUseAddressSuggestion = vi.fn();

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

const renderComponent = () =>
  render(
    <FormTestWrapper>
      <TransformationAdresseAdministrative
        formKind={FormKind.EXTENSION}
        originalAntennes={[]}
      />
    </FormTestWrapper>
  );

describe("TransformationAdresseAdministrative", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  it("affiche le titre de saisie de l'adresse administrative", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", {
        name: /saisir l.adresse administrative principale de la structure/i,
      })
    ).toBeInTheDocument();
  });

  it("laisse les champs nom et adresse éditables", () => {
    renderComponent();

    expect(
      screen.getByLabelText("Nom de la structure (optionnel)")
    ).not.toBeDisabled();
    expect(
      screen.getByLabelText("Adresse principale de la structure")
    ).not.toBeDisabled();
  });

  it("ne rend plus la question « adresse a changé »", () => {
    renderComponent();

    expect(
      screen.queryByText(/Est-ce que le nom d.usage de la structure/i)
    ).not.toBeInTheDocument();
  });
});
