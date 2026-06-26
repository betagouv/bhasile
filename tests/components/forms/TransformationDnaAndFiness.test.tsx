import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationDnaAndFiness } from "@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness";
import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";
import { StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/hooks/useFetchFreeDnaCodes", () => ({
  useFetchFreeDnaCodes: vi.fn(),
}));

const defaultValuesAutorisee = {
  type: StructureType.CADA,
  dnaStructures: [{ dna: { code: "", description: "" } }],
  finesses: [{ code: "", description: "" }],
};

const defaultValuesSubventionnee = {
  type: StructureType.HUDA,
  dnaStructures: [{ dna: { code: "", description: "" } }],
  finesses: [],
};

const mockedUseFetchFreeDnaCodes = vi.mocked(useFetchFreeDnaCodes);

describe("TransformationDnaAndFiness", () => {
  beforeEach(() => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({
      freeDnaCodes: [{ code: "C0001" }, { code: "C0002" }],
    });
  });

  describe("Structure autorisée (CADA)", () => {
    it("affiche les sections DNA et FINESS avec un seul champ chacune, sans checkbox", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <TransformationDnaAndFiness />
        </FormTestWrapper>
      );

      expect(
        screen.getByRole("combobox", { name: "Code" })
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Code" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Ajouter un code DNA/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Ajouter un code FINESS/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("câble le lien contactez-nous en mailto et les ressources vers les fichiers /public", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <TransformationDnaAndFiness />
        </FormTestWrapper>
      );

      expect(
        screen.getByRole("link", { name: "contactez-nous" })
      ).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
      expect(
        screen.getByRole("link", { name: "fiche de paramétrage" })
      ).toHaveAttribute(
        "href",
        "/07-Fiche_de_parametrage_OFII-transformation_parc.xlsx"
      );
      expect(screen.getByRole("link", { name: "Instructions" })).toHaveAttribute(
        "href",
        "/Instruction%20INTV2609238J.pdf"
      );
      expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute(
        "href",
        "/11-FAQ%20Transformation%20HUDA%20en%20CADA_FV.pdf"
      );
    });
  });

  describe("Structure subventionnée (HUDA)", () => {
    it("affiche uniquement la section DNA, sans FINESS", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesSubventionnee}>
          <TransformationDnaAndFiness />
        </FormTestWrapper>
      );

      expect(
        screen.getByRole("combobox", { name: "Code" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Code FINESS" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Ajouter un code FINESS/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Ajout d'un second code DNA", () => {
    it("passe en colonnes Code + Description et permet la suppression", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper defaultValues={defaultValuesSubventionnee}>
          <TransformationDnaAndFiness />
        </FormTestWrapper>
      );

      expect(
        screen.queryByRole("textbox", { name: "Description" })
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /Ajouter un code DNA/i })
      );

      expect(
        screen.getAllByRole("combobox", { name: "Code" })
      ).toHaveLength(2);
      expect(
        screen.getAllByRole("textbox", { name: "Description" })
      ).toHaveLength(2);
      expect(
        screen.queryByRole("combobox", { name: "Code DNA" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Supprimer" })
      ).toBeInTheDocument();
    });
  });
});
