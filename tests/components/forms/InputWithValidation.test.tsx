import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import InputWithValidation from "@/app/components/forms/InputWithValidation";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

describe("InputWithValidation", () => {
  describe("Edge cases - null and undefined values", () => {
    it("gère proprement une valeur texte null", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testField: null,
          }}
        >
          <InputWithValidation
            name="testField"
            id="testField"
            type="text"
            label="Test Field"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Field");
      expect(input).toHaveValue("");
    });

    it("gère proprement une valeur texte undefined", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testField: undefined,
          }}
        >
          <InputWithValidation
            name="testField"
            id="testField"
            type="text"
            label="Test Field"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Field");
      expect(input).toHaveValue("");
    });

    it("gère proprement une valeur date null", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testDate: null,
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      expect(input).toHaveValue("");
    });

    it("gère proprement une valeur date undefined", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testDate: undefined,
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      expect(input).toHaveValue("");
    });

    it("gère proprement une valeur numérique null", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testNumber: null,
          }}
        >
          <InputWithValidation
            name="testNumber"
            id="testNumber"
            type="number"
            label="Test Number"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Number");
      expect(input).toHaveValue(null);
    });
  });

  describe("Edge cases - empty values", () => {
    it("gère une chaîne texte vide", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testField: "",
          }}
        >
          <InputWithValidation
            name="testField"
            id="testField"
            type="text"
            label="Test Field"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Field");
      expect(input).toHaveValue("");
    });

    it("gère une chaîne date vide", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testDate: "",
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      expect(input).toHaveValue("");
    });
  });

  describe("Date format handling", () => {
    it("gère le format JJ/MM/AAAA pour les dates", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testDate: "15/01/2024",
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      expect(input).toHaveValue("2024-01-15");
    });

    it("gère le format AAAA-MM-JJ pour les dates", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            testDate: "2024-01-15",
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      expect(input).toHaveValue("2024-01-15");
    });

    it("convertit la saisie de date du format HTML vers JJ/MM/AAAA", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            testDate: "",
          }}
        >
          <InputWithValidation
            name="testDate"
            id="testDate"
            type="date"
            label="Test Date"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Date");
      await user.type(input, "2024-01-15");

      await waitFor(() => {
        expect(input).toHaveValue("2024-01-15");
      });
    });
  });

  describe("Number input handling", () => {
    it("gère une saisie numérique vide", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            testNumber: "",
          }}
        >
          <InputWithValidation
            name="testNumber"
            id="testNumber"
            type="number"
            label="Test Number"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Number");

      expect(input).toHaveValue(null);

      await user.clear(input);

      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it("gère correctement une saisie numérique", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            testNumber: "",
          }}
        >
          <InputWithValidation
            name="testNumber"
            id="testNumber"
            type="number"
            label="Test Number"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Number");
      await user.type(input, "42");

      await waitFor(() => {
        expect(input).toHaveValue(42);
      });
    });
  });

  describe("Text input handling", () => {
    it("gère correctement une saisie de texte", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            testField: "",
          }}
        >
          <InputWithValidation
            name="testField"
            id="testField"
            type="text"
            label="Test Field"
          />
        </FormTestWrapper>
      );

      const input = screen.getByLabelText("Test Field");
      await user.type(input, "Test value");

      await waitFor(() => {
        expect(input).toHaveValue("Test value");
      });
    });
  });
});
