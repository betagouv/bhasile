import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";
import { StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/hooks/useFetchFreeDnaCodes", () => ({
  useFetchFreeDnaCodes: vi.fn(),
}));

const defaultValuesAutorisee = {
  type: StructureType.CADA,
  isMultiDna: false,
  dnaStructures: [{ description: "", dna: { code: "" } }],
  structureFinesses: [{ description: "", finess: { code: "" } }],
};

const defaultValuesSubventionnee = {
  type: StructureType.HUDA,
  isMultiDna: false,
  dnaStructures: [{ description: "", dna: { code: "" } }],
  structureFinesses: [],
};

const mockedUseFetchFreeDnaCodes = vi.mocked(useFetchFreeDnaCodes);

describe("DnaAndFiness", () => {
  beforeEach(() => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({
      freeDnaCodes: [{ code: "C0001" }, { code: "C0002" }],
    });
  });

  describe("Single mode (autorisée)", () => {
    it("affiche un select Code DNA et un champ Code FINESS", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      const dnaSelect = screen.getByRole("combobox", { name: "Code DNA" });
      expect(dnaSelect).toBeInTheDocument();
      expect(within(dnaSelect).getByRole("option", { name: "C0001" })).toBeInTheDocument();
      expect(screen.getByLabelText("Code FINESS")).toBeInTheDocument();
    });
  });

  describe("Single mode (subventionnée)", () => {
    it("affiche uniquement Code DNA, sans Code FINESS", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesSubventionnee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByRole("combobox", { name: "Code DNA" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Code FINESS")).not.toBeInTheDocument();
    });
  });

  describe("Multi mode (autorisée)", () => {
    it("affiche les sections Codes DNA et Codes FINESS", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            ...defaultValuesAutorisee,
            isMultiDna: true,
            dnaStructures: [
              { description: "DNA 1", dna: { code: "C0001" } },
              { description: "DNA 2", dna: { code: "C0002" } },
            ],
            structureFinesses: [
              { description: "Finess 1", finess: { code: "123456789" } },
              { description: "Finess 2", finess: { code: "987654321" } },
            ],
          }}
        >
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByText("Codes DNA")).toBeInTheDocument();
      expect(screen.getByText("Codes FINESS")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Ajouter un code DNA/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Ajouter un code FINESS/i })
      ).toBeInTheDocument();
    });
  });

  describe("Toggling multi checkbox", () => {
    it("bascule de l'UI simple à l'UI multi quand la case est cochée", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByRole("combobox", { name: "Code DNA" })).toBeInTheDocument();
      expect(screen.getByLabelText("Code FINESS")).toBeInTheDocument();
      expect(screen.queryByText("Codes DNA")).not.toBeInTheDocument();

      const multiCheckbox = screen.getByRole("checkbox", {
        name: /La structure dispose de plusieurs codes DNA et\/ou FINESS/i,
      });
      await user.click(multiCheckbox);

      expect(screen.getByText("Codes DNA")).toBeInTheDocument();
      expect(screen.getByText("Codes FINESS")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Code DNA" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Changing data in multi mode", () => {
    it("ajoute une nouvelle ligne DNA au clic sur Ajouter un code DNA", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            ...defaultValuesAutorisee,
            isMultiDna: true,
            dnaStructures: [{ description: "", dna: { code: "" } }],
            structureFinesses: [{ description: "", finess: { code: "" } }],
          }}
        >
          <DnaAndFiness />
        </FormTestWrapper>
      );

      const dnaFieldset = screen.getByRole("group", { name: /Codes DNA/i });
      const codeSelectsBefore = within(dnaFieldset).getAllByRole("combobox", {
        name: "Code",
      });
      expect(codeSelectsBefore).toHaveLength(1);

      await user.click(
        screen.getByRole("button", { name: /Ajouter un code DNA/i })
      );

      const codeSelectsAfter = within(dnaFieldset).getAllByRole("combobox", {
        name: "Code",
      });
      expect(codeSelectsAfter).toHaveLength(2);
    });

    it("affiche la poubelle dès le premier code FINESS renseigné et vide le champ sans retirer la ligne", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            ...defaultValuesAutorisee,
            isMultiDna: true,
            dnaStructures: [{ description: "", dna: { code: "" } }],
            structureFinesses: [
              { description: "", finess: { code: "123456789" } },
            ],
          }}
        >
          <DnaAndFiness />
        </FormTestWrapper>
      );

      const finessCode = screen.getByRole("textbox", { name: "Code" });
      expect(finessCode).toHaveValue("123456789");
      expect(
        screen.getByRole("button", { name: "Supprimer" })
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Supprimer" }));

      expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue("");
      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    });
  });
});
