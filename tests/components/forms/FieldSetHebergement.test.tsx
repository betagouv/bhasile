import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { CURRENT_YEAR } from "@/constants";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@formkit/auto-animate", () => ({
  default: vi.fn(),
}));

const mockUseAddressSuggestion = vi.fn();
vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

const buildEmptyAdresse = () => ({
  adresseComplete: "",
  adresse: "",
  codePostal: "",
  commune: "",
  departement: "",
  repartition: Repartition.DIFFUS,
  adresseTypologies: [
    {
      year: CURRENT_YEAR,
      placesAutorisees: undefined,
      logementSocial: false,
      qpv: false,
    },
  ],
});

const buildFilledAdresse = (
  overrides: Partial<ReturnType<typeof buildEmptyAdresse>> = {}
) => ({
  ...buildEmptyAdresse(),
  adresseComplete: "1 rue de la République, 75001 Paris",
  adresse: "1 rue de la République",
  codePostal: "75001",
  commune: "Paris",
  departement: "Paris",
  ...overrides,
});

describe("FieldSetHebergement", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  describe("Delete button visibility", () => {
    it("should hide the delete button when the only address is empty", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [buildEmptyAdresse()],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    });

    it("should show the delete button when the only address has data", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [buildFilledAdresse()],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(
        screen.getByRole("button", { name: "Supprimer" })
      ).toBeInTheDocument();
    });

    it("should show a delete button on every address when there is more than one, even pristine ones", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [buildFilledAdresse(), buildEmptyAdresse()],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        2
      );
    });
  });

  describe("Delete button behavior", () => {
    it("should remove the clicked address when there is more than one", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [
              buildFilledAdresse({
                adresseComplete: "Adresse 1, 75001 Paris",
              }),
              buildFilledAdresse({
                adresseComplete: "Adresse 2, 75002 Paris",
              }),
            ],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: "Supprimer",
      });
      await user.click(deleteButtons[0]);

      expect(
        screen.getByDisplayValue("Adresse 2, 75002 Paris")
      ).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue("Adresse 1, 75001 Paris")
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        1
      );
    });

    it("should reset the address to empty when clicking delete on the only address", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [
              buildFilledAdresse({
                adresseComplete: "Adresse à effacer, 75001 Paris",
              }),
            ],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(
        screen.getByDisplayValue("Adresse à effacer, 75001 Paris")
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Supprimer" }));

      expect(
        screen.queryByDisplayValue("Adresse à effacer, 75001 Paris")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    });

    it("should shift remaining address values up when deleting an earlier row", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.DIFFUS,
            adresses: [
              buildFilledAdresse({
                adresseComplete: "Première, 75001 Paris",
              }),
              buildFilledAdresse({
                adresseComplete: "Deuxième, 75002 Paris",
              }),
              buildFilledAdresse({
                adresseComplete: "Troisième, 75003 Paris",
              }),
            ],
          }}
        >
          <FieldSetHebergement formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      const addressInputs = screen.getAllByLabelText("Adresse");
      expect(addressInputs).toHaveLength(3);

      const deleteButtons = screen.getAllByRole("button", {
        name: "Supprimer",
      });
      await user.click(deleteButtons[0]);

      const remainingInputs = screen.getAllByLabelText("Adresse");
      expect(remainingInputs).toHaveLength(2);
      expect(remainingInputs[0]).toHaveValue("Deuxième, 75002 Paris");
      expect(remainingInputs[1]).toHaveValue("Troisième, 75003 Paris");
      expect(
        screen.queryByDisplayValue("Première, 75001 Paris")
      ).not.toBeInTheDocument();
    });
  });
});
