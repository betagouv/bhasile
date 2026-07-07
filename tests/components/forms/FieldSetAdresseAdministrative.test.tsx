import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FieldSetAdresseAdministrative } from "@/app/components/forms/adresseAdministrativeAndAntenne/FieldSetAdresseAdministrative";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const mockAddressSuggestions = [
  {
    id: "1",
    key: "1",
    label: "10 Rue de la Paix, 75001 Paris",
    housenumber: "10",
    street: "Rue de la Paix",
    postcode: "75001",
    city: "Paris",
    context: "75, Paris, Île-de-France",
    x: 2.3314,
    y: 48.8686,
    score: 0.95,
  },
  {
    id: "2",
    key: "2",
    label: "20 Rue de la Paix, 75001 Paris",
    housenumber: "20",
    street: "Rue de la Paix",
    postcode: "75001",
    city: "Paris",
    context: "75, Paris, Île-de-France",
    x: 2.3315,
    y: 48.8687,
    score: 0.9,
  },
];

const mockUseAddressSuggestion = vi.fn();

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => mockUseAddressSuggestion,
}));

describe("FieldSetAdresseAdministrative", () => {
  beforeEach(() => {
    mockUseAddressSuggestion.mockResolvedValue([]);
  });

  describe("Rendering finalisation form", () => {
    it("affiche tous les champs requis", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            nom: "",
            adresseAdministrativeComplete: "",
            adresseAdministrative: "",
            codePostalAdministratif: "",
            communeAdministrative: "",
            departementAdministratif: "",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.getByText("Structure")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Nom de la structure (optionnel)")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Adresse principale de la structure")
      ).toBeInTheDocument();
    });

    it("affiche la mention sur la confidentialité de l'adresse", () => {
      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/indiquée dans les documents de contractualisation/)
      ).toBeInTheDocument();
    });

    it("affiche le texte d'aide pour le nom de la structure", () => {
      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.getByText("ex. Les Coquelicots")).toBeInTheDocument();
    });

    it("affiche le texte d'aide pour l'adresse", () => {
      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/indiquée dans les documents de contractualisation/i)
      ).toBeInTheDocument();
    });

    it("n'affiche pas le champ Type de bâti", () => {
      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.queryByLabelText("Type de bâti")).not.toBeInTheDocument();
    });
  });

  describe("Rendering modification form", () => {
    it("n'affiche pas la mention sur la confidentialité de l'adresse", () => {
      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(
        screen.queryByText(
          /L'ensemble des adresses ne seront communiquées qu'aux agentes/i
        )
      ).not.toBeInTheDocument();
    });

    it("affiche le champ Type de bâti", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.COLLECTIF,
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(screen.getByLabelText("Type de bâti")).toBeInTheDocument();
    });

    it("propose toutes les options de répartition dans le select Type de bâti", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: "",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      const typeBatiSelect = screen.getByLabelText(
        "Type de bâti"
      ) as HTMLSelectElement;
      const options = Array.from(typeBatiSelect.options).map(
        (opt) => opt.value
      );

      expect(options).toContain(Repartition.COLLECTIF);
      expect(options).toContain(Repartition.DIFFUS);
      expect(options).toContain(Repartition.MIXTE);
    });
  });

  describe("Structure name field", () => {
    it("met à jour la valeur du champ nom", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            nom: "",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const nomInput = screen.getByLabelText("Nom de la structure (optionnel)");
      await user.type(nomInput, "Les Mimosas");

      await waitFor(() => {
        expect(nomInput).toHaveValue("Les Mimosas");
      });
    });
  });

  describe("Address autocomplete integration", () => {
    it("passe les bonnes props à AddressWithValidation et affiche l'adresse", () => {
      const testAddress = "1 rue de Paris, 75001 Paris";
      render(
        <FormTestWrapper
          defaultValues={{
            adresseAdministrativeComplete: testAddress,
            adresseAdministrative: "1 rue de Paris",
            codePostalAdministratif: "75001",
            communeAdministrative: "Paris",
            departementAdministratif: "75",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const addressInput = screen.getByLabelText(
        "Adresse principale de la structure"
      );
      expect(addressInput).toHaveValue(testAddress);
    });

    it("affiche les suggestions d'adresse pendant la saisie", async () => {
      const user = userEvent.setup();
      mockUseAddressSuggestion.mockResolvedValue(mockAddressSuggestions);

      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const addressInput = screen.getByLabelText(
        "Adresse principale de la structure"
      );

      await user.type(addressInput, "10 Rue");

      await waitFor(
        () => {
          expect(mockUseAddressSuggestion).toHaveBeenCalledWith("10 Rue");
        },
        { timeout: 1000 }
      );

      await waitFor(
        () => {
          expect(
            screen.getByText("10 Rue de la Paix, 75001 Paris")
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      expect(
        screen.getByText("20 Rue de la Paix, 75001 Paris")
      ).toBeInTheDocument();
    });

    it("remplit les champs d'adresse à la sélection d'une suggestion", async () => {
      const user = userEvent.setup();
      mockUseAddressSuggestion.mockResolvedValue(mockAddressSuggestions);

      render(
        <FormTestWrapper
          defaultValues={{
            adresseAdministrativeComplete: "",
            adresseAdministrative: "",
            codePostalAdministratif: "",
            communeAdministrative: "",
            departementAdministratif: "",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const addressInput = screen.getByLabelText(
        "Adresse principale de la structure"
      );

      await user.type(addressInput, "10 Rue");

      await waitFor(
        () => {
          expect(
            screen.getByText("10 Rue de la Paix, 75001 Paris")
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const firstSuggestion = screen.getByText(
        "10 Rue de la Paix, 75001 Paris"
      );
      await user.click(firstSuggestion);

      await waitFor(() => {
        expect(addressInput).toHaveValue("10 Rue de la Paix, 75001 Paris");
      });
    });

    it("n'affiche pas de suggestions pour les requêtes de moins de 3 caractères", async () => {
      const user = userEvent.setup();
      mockUseAddressSuggestion.mockResolvedValue(mockAddressSuggestions);

      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const addressInput = screen.getByLabelText(
        "Adresse principale de la structure"
      );

      // Clear any previous calls
      mockUseAddressSuggestion.mockClear();

      await user.type(addressInput, "10");

      await waitFor(
        () => {
          expect(mockUseAddressSuggestion).not.toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      expect(
        screen.queryByText("10 Rue de la Paix, 75001 Paris")
      ).not.toBeInTheDocument();
    });

    it("affiche l'état de chargement pendant la récupération des suggestions", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: typeof mockAddressSuggestions) => void;
      const controlledPromise = new Promise<typeof mockAddressSuggestions>(
        (resolve) => {
          resolvePromise = resolve;
        }
      );
      mockUseAddressSuggestion.mockReturnValue(controlledPromise);

      render(
        <FormTestWrapper defaultValues={{}}>
          <FieldSetAdresseAdministrative formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const addressInput = screen.getByLabelText(
        "Adresse principale de la structure"
      );

      await user.type(addressInput, "10 Rue");

      await waitFor(
        () => {
          expect(screen.getByText("Chargement...")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      resolvePromise!(mockAddressSuggestions);

      await waitFor(
        () => {
          expect(
            screen.getByText("10 Rue de la Paix, 75001 Paris")
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Type de bâti field (MODIFICATION mode)", () => {
    it("met à jour la valeur du Type de bâti", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: "",
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      const typeBatiSelect = screen.getByLabelText("Type de bâti");
      await user.selectOptions(typeBatiSelect, Repartition.COLLECTIF);

      await waitFor(() => {
        expect(typeBatiSelect).toHaveValue(Repartition.COLLECTIF);
      });
    });

    it("bascule entre les types de répartition", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            typeBati: Repartition.COLLECTIF,
          }}
        >
          <FieldSetAdresseAdministrative formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      const typeBatiSelect = screen.getByLabelText("Type de bâti");
      expect(typeBatiSelect).toHaveValue(Repartition.COLLECTIF);

      await user.selectOptions(typeBatiSelect, Repartition.DIFFUS);

      await waitFor(() => {
        expect(typeBatiSelect).toHaveValue(Repartition.DIFFUS);
      });
    });
  });
});
