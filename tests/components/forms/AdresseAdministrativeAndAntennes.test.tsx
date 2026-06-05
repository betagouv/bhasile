import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const mockUseAddressSuggestion = vi.fn();

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

const ADRESSE = {
  nom: "Les Mimosas",
  adresseAdministrativeComplete: "58 boulevard Vauban, 50300 Avranches",
  adresseAdministrative: "58 boulevard Vauban",
  codePostalAdministratif: "50300",
  communeAdministrative: "Avranches",
  departementAdministratif: "50",
};

const renderComponent = (props: {
  formKind: FormKind;
  isAdresseAdministrativeLocked?: boolean;
}) =>
  render(
    <FormTestWrapper defaultValues={ADRESSE}>
      <AdresseAdministrativeAndAntennes {...props} />
    </FormTestWrapper>
  );

const getNomInput = () =>
  screen.getByRole("textbox", { name: "Nom de la structure (optionnel)" });
const getAdresseInput = () =>
  screen.getByRole("combobox", { name: "Adresse principale de la structure" });

describe("AdresseAdministrativeAndAntennes", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  it("verrouille nom + adresse quand isAdresseAdministrativeLocked est vrai", () => {
    renderComponent({
      formKind: FormKind.EXTENSION,
      isAdresseAdministrativeLocked: true,
    });

    expect(getNomInput()).toBeDisabled();
    expect(getAdresseInput()).toBeDisabled();
  });

  it("laisse les champs éditables quand isAdresseAdministrativeLocked est faux", () => {
    renderComponent({
      formKind: FormKind.EXTENSION,
      isAdresseAdministrativeLocked: false,
    });

    expect(getNomInput()).not.toBeDisabled();
    expect(getAdresseInput()).not.toBeDisabled();
  });

  it("ne rend plus la question « adresse a changé » (remontée dans le composant parent)", () => {
    renderComponent({
      formKind: FormKind.EXTENSION,
      isAdresseAdministrativeLocked: true,
    });

    expect(
      screen.queryByText(/Est-ce que le nom d.usage de la structure/i)
    ).not.toBeInTheDocument();
  });

  it("hors transformation : pas de verrou par défaut", () => {
    renderComponent({ formKind: FormKind.FINALISATION });

    expect(getNomInput()).not.toBeDisabled();
    expect(getAdresseInput()).not.toBeDisabled();
  });
});
