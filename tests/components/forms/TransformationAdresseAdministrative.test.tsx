import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative";
import { AdresseSource } from "@/app/utils/transformation.util";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const mockUseAddressSuggestion = vi.fn();

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

const ADRESSE_SOURCE: AdresseSource = {
  nom: "Les Mimosas",
  adresseAdministrativeComplete: "58 boulevard Vauban, 50300 Avranches",
  adresseAdministrative: "58 boulevard Vauban",
  codePostalAdministratif: "50300",
  communeAdministrative: "Avranches",
  departementAdministratif: "50",
};

const renderComponent = (
  defaultValues: Record<string, unknown> = ADRESSE_SOURCE
) =>
  render(
    <FormTestWrapper defaultValues={defaultValues}>
      <TransformationAdresseAdministrative
        formKind={FormKind.EXTENSION}
        originalAdresse={ADRESSE_SOURCE}
      />
    </FormTestWrapper>
  );

const getNomInput = () =>
  screen.getByLabelText("Nom de la structure (optionnel)");
const getAdresseInput = () =>
  screen.getByLabelText("Adresse principale de la structure");

// Deux groupes Oui/Non coexistent (changement d'adresse + sites administratifs) :
// on cible le radio « adresse a changé » via le conteneur de sa question.
const clickAdresseChangedRadio = async (
  user: ReturnType<typeof userEvent.setup>,
  answer: "Oui" | "Non"
) => {
  const question = screen.getByText(
    /Est-ce que le nom d.usage de la structure/i
  );
  const group = question.closest("div") as HTMLElement;
  await user.click(within(group).getByLabelText(answer));
};

describe("TransformationAdresseAdministrative", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  it("verrouille par défaut quand le brouillon égale l'adresse source (pas de réponse)", () => {
    renderComponent();

    expect(
      screen.getByText(/Est-ce que le nom d.usage de la structure/i)
    ).toBeInTheDocument();
    expect(getNomInput()).toBeDisabled();
    expect(getAdresseInput()).toBeDisabled();
    expect(getNomInput()).toHaveValue(ADRESSE_SOURCE.nom);
  });

  it("démarre déverrouillé quand le brouillon diffère déjà de la source (reload d'une adresse modifiée)", () => {
    renderComponent({ ...ADRESSE_SOURCE, nom: "Nouveau nom" });

    expect(getNomInput()).not.toBeDisabled();
    expect(getNomInput()).toHaveValue("Nouveau nom");
    const question = screen.getByText(
      /Est-ce que le nom d.usage de la structure/i
    );
    const group = question.closest("div") as HTMLElement;
    expect(within(group).getByLabelText("Oui")).toBeChecked();
  });

  it("déverrouille et vide les champs quand on répond Oui", async () => {
    const user = userEvent.setup();
    renderComponent();

    await clickAdresseChangedRadio(user, "Oui");

    await waitFor(() => expect(getNomInput()).not.toBeDisabled());
    expect(getNomInput()).toHaveValue("");
    expect(getAdresseInput()).not.toBeDisabled();
  });

  it("restaure l'adresse source et reverrouille quand on répond Non après Oui", async () => {
    const user = userEvent.setup();
    renderComponent();

    await clickAdresseChangedRadio(user, "Oui");
    await waitFor(() => expect(getNomInput()).toHaveValue(""));

    await clickAdresseChangedRadio(user, "Non");

    await waitFor(() =>
      expect(getNomInput()).toHaveValue(ADRESSE_SOURCE.nom)
    );
    expect(getNomInput()).toBeDisabled();
    expect(getAdresseInput()).toBeDisabled();
  });
});
