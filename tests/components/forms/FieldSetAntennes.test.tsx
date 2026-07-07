import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Antennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/Antennes";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/components/forms/AddressWithValidation", () => ({
  default: () => <div data-testid="address-field" />,
}));

const renderAntennes = (antennes: Record<string, unknown>[]) =>
  render(
    <FormTestWrapper defaultValues={{ isMultiAntenne: true, antennes }}>
      <Antennes />
    </FormTestWrapper>
  );

describe("Antennes", () => {
  describe("Delete button visibility", () => {
    it("masque le bouton supprimer sur chaque antenne au minimum quand toutes sont vierges", () => {
      renderAntennes([{}, {}]);

      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    });

    it("affiche le bouton supprimer uniquement sur l'antenne remplie quand on est au minimum", () => {
      renderAntennes([{ name: "Avranches Nord" }, {}]);

      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        1
      );
    });

    it("affiche un bouton supprimer sur chaque antenne au-dessus du minimum, même les vierges", () => {
      renderAntennes([{}, {}, {}]);

      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        3
      );
    });
  });

  describe("Rendering", () => {
    it("n'affiche rien quand isMultiAntenne est false", () => {
      render(
        <FormTestWrapper
          defaultValues={{ isMultiAntenne: false, antennes: [] }}
        >
          <Antennes />
        </FormTestWrapper>
      );

      expect(
        screen.queryByText("Sites administratifs")
      ).not.toBeInTheDocument();
    });
  });
});
