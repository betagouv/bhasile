import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import { StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const defaultValuesAutorisee = {
  type: StructureType.CADA,
  isMultiDna: false,
  dnaStructures: [{ dna: { code: "", description: "" } }],
  finesses: [{ code: "", description: "" }],
};

const defaultValuesSubventionnee = {
  type: StructureType.HUDA,
  isMultiDna: false,
  dnaStructures: [{ dna: { code: "", description: "" } }],
  finesses: [],
};

describe("DnaAndFiness", () => {
  describe("Single mode (autorisée)", () => {
    it("should show one Code DNA and one Code FINESS input", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByLabelText("Code DNA")).toBeInTheDocument();
      expect(screen.getByLabelText("Code FINESS")).toBeInTheDocument();
    });
  });

  describe("Single mode (subventionnée)", () => {
    it("should show only Code DNA, no Code FINESS", () => {
      render(
        <FormTestWrapper defaultValues={defaultValuesSubventionnee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByLabelText("Code DNA")).toBeInTheDocument();
      expect(screen.queryByLabelText("Code FINESS")).not.toBeInTheDocument();
    });
  });

  describe("Multi mode (autorisée)", () => {
    it("should show Codes DNA and Codes FINESS sections", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            ...defaultValuesAutorisee,
            isMultiDna: true,
            dnaStructures: [
              { dna: { code: "C0001", description: "DNA 1" } },
              { dna: { code: "C0002", description: "DNA 2" } },
            ],
            finesses: [
              { code: "123456789", description: "Finess 1" },
              { code: "987654321", description: "Finess 2" },
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
    it("should switch from single to multi UI when checkbox is checked", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      expect(screen.getByLabelText("Code DNA")).toBeInTheDocument();
      expect(screen.getByLabelText("Code FINESS")).toBeInTheDocument();
      expect(screen.queryByText("Codes DNA")).not.toBeInTheDocument();

      const multiCheckbox = screen.getByRole("checkbox", {
        name: /La structure dispose de plusieurs codes DNA et\/ou FINESS/i,
      });
      await user.click(multiCheckbox);

      expect(screen.getByText("Codes DNA")).toBeInTheDocument();
      expect(screen.getByText("Codes FINESS")).toBeInTheDocument();
      expect(screen.queryByLabelText("Code DNA")).not.toBeInTheDocument();
    });
  });

  describe("Changing data in single mode", () => {
    it("should keep typed value in Code DNA input", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper defaultValues={defaultValuesAutorisee}>
          <DnaAndFiness />
        </FormTestWrapper>
      );

      const codeDnaInput = screen.getByLabelText("Code DNA");
      await user.type(codeDnaInput, "C0001");

      expect(codeDnaInput).toHaveValue("C0001");
    });
  });

  describe("Changing data in multi mode", () => {
    it("should add a new DNA row when clicking Ajouter un code DNA", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            ...defaultValuesAutorisee,
            isMultiDna: true,
            dnaStructures: [{ dna: { code: "", description: "" } }],
            finesses: [{ code: "", description: "" }],
          }}
        >
          <DnaAndFiness />
        </FormTestWrapper>
      );

      const dnaFieldset = screen.getByRole("group", { name: /Codes DNA/i });
      const codeInputsBefore = within(dnaFieldset).getAllByLabelText("Code");
      expect(codeInputsBefore).toHaveLength(1);

      await user.click(
        screen.getByRole("button", { name: /Ajouter un code DNA/i })
      );

      const codeInputsAfter = within(dnaFieldset).getAllByLabelText("Code");
      expect(codeInputsAfter).toHaveLength(2);
    });
  });
});
