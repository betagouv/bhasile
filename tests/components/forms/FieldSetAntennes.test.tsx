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
    it("hides the delete button on every antenne when at the minimum and all are pristine", () => {
      renderAntennes([{}, {}]);

      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    });

    it("shows the delete button only on the filled antenne when at the minimum", () => {
      renderAntennes([{ name: "Avranches Nord" }, {}]);

      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        1
      );
    });

    it("shows a delete button on every antenne when above the minimum, even pristine ones", () => {
      renderAntennes([{}, {}, {}]);

      expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
        3
      );
    });
  });

  describe("Rendering", () => {
    it("renders nothing when isMultiAntenne is false", () => {
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
