import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldSetNotes } from "@/app/components/forms/notes/FieldSetNotes";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

describe("FieldSetNotes", () => {
  describe("Rendering", () => {
    it("rend la zone de texte des notes", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            notes: "",
          }}
        >
          <FieldSetNotes />
        </FormTestWrapper>
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("id", "notes");
    });

    it("affiche l'exemple en texte d'aide", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            notes: "",
          }}
        >
          <FieldSetNotes />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/17\/05\/2025 Jean-Michel DUPONT/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/dialogue de gestion/i)).toBeInTheDocument();
    });

    it("dimensionne la zone de texte à 8 lignes", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            notes: "",
          }}
        >
          <FieldSetNotes />
        </FormTestWrapper>
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "8");
    });
  });

  describe("Text input", () => {
    it("gère la saisie de texte", async () => {
      const historicalNotes =
        "10/12/2024 - Visite sur site effectuée\n" +
        "15/12/2024 - Réception des documents\n" +
        "20/12/2024 - Validation du budget\n" +
        "05/01/2025 - Suivi téléphonique";

      render(
        <FormTestWrapper
          defaultValues={{
            notes: historicalNotes,
          }}
        >
          <FieldSetNotes />
        </FormTestWrapper>
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(historicalNotes);
    });
  });

  describe("Form field attributes", () => {
    it("définit le bon attribut name", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            notes: "",
          }}
        >
          <FieldSetNotes />
        </FormTestWrapper>
      );

      const textarea = container.querySelector('textarea[id="notes"]');
      expect(textarea).toBeInTheDocument();
    });
  });
});
