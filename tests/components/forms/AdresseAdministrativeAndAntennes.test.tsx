import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const mockUseAddressSuggestion = vi.fn();

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

const ORIGINAL_ADRESSE = {
  nom: "Les Mimosas",
  adresseAdministrativeComplete: "58 boulevard Vauban, 50300 Avranches",
  adresseAdministrative: "58 boulevard Vauban",
  codePostalAdministratif: "50300",
  communeAdministrative: "Avranches",
  departementAdministratif: "50",
};

const renderWithFormKind = (formKind: FormKind) =>
  render(
    <FormTestWrapper defaultValues={ORIGINAL_ADRESSE}>
      <AdresseAdministrativeAndAntennes formKind={formKind} />
    </FormTestWrapper>
  );

const getNomInput = () =>
  screen.getByLabelText("Nom de la structure (optionnel)");
const getAdresseInput = () =>
  screen.getByLabelText("Adresse principale de la structure");

// Sur une transformation, deux groupes Oui/Non coexistent (changement d'adresse
// + sites administratifs) : on cible le radio « adresse a changé » via le
// conteneur de sa question.
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

describe("AdresseAdministrativeAndAntennes", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  describe("transformation (extension / contraction)", () => {
    it("affiche la question et verrouille nom + adresse tant qu'il n'y a pas de réponse", () => {
      renderWithFormKind(FormKind.EXTENSION);

      expect(
        screen.getByText(/Est-ce que le nom d.usage de la structure/i)
      ).toBeInTheDocument();
      expect(getNomInput()).toBeDisabled();
      expect(getAdresseInput()).toBeDisabled();
      expect(getNomInput()).toHaveValue(ORIGINAL_ADRESSE.nom);
    });

    it("déverrouille et vide les champs quand on répond Oui", async () => {
      const user = userEvent.setup();
      renderWithFormKind(FormKind.EXTENSION);

      await clickAdresseChangedRadio(user, "Oui");

      await waitFor(() => {
        expect(getNomInput()).not.toBeDisabled();
      });
      expect(getNomInput()).toHaveValue("");
      expect(getAdresseInput()).not.toBeDisabled();
    });

    it("restaure l'adresse d'origine et reverrouille quand on répond Non après Oui", async () => {
      const user = userEvent.setup();
      renderWithFormKind(FormKind.EXTENSION);

      await clickAdresseChangedRadio(user, "Oui");
      await waitFor(() => expect(getNomInput()).toHaveValue(""));

      await clickAdresseChangedRadio(user, "Non");

      await waitFor(() => {
        expect(getNomInput()).toHaveValue(ORIGINAL_ADRESSE.nom);
      });
      expect(getNomInput()).toBeDisabled();
      expect(getAdresseInput()).toBeDisabled();
    });
  });

  describe("hors transformation (création / finalisation)", () => {
    it("n'affiche pas la question et ne verrouille pas les champs", () => {
      renderWithFormKind(FormKind.FINALISATION);

      expect(
        screen.queryByText(/Est-ce que le nom d.usage de la structure/i)
      ).not.toBeInTheDocument();
      expect(getNomInput()).not.toBeDisabled();
      expect(getAdresseInput()).not.toBeDisabled();
    });
  });
});
