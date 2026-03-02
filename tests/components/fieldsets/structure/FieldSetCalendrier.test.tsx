import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FieldSetCalendrier } from "@/app/components/forms/calendrier/FieldSetCalendrier";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../../test-utils/form-test-wrapper";

describe("FieldSetCalendrier", () => {
  describe("Rendering with autorisée structure (CADA)", () => {
    it("should render only autorisation and convention sections", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,

            debutPeriodeAutorisation: "01/01/2024",
            finPeriodeAutorisation: "31/12/2028",
            debutConvention: "01/01/2024",
            finConvention: "31/12/2028",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const datesDebuts = screen.getAllByLabelText(/Date de début/i);
      const datesFins = screen.getAllByLabelText(/Date de fin/i);
      expect(datesDebuts.length).toBe(2);
      expect(datesFins.length).toBe(2);
    });

    it("should show optional label for convention section", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(
        screen.getByText("Convention en cours (optionnel)")
      ).toBeInTheDocument();
    });

    it("should display notice about optional convention", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/Uniquement si votre structure est sous convention/i)
      ).toBeInTheDocument();
    });
  });

  describe("Rendering with subventionnée structure (HUDA)", () => {
    it("should not render autorisation period section", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.HUDA,

            debutConvention: "01/01/2024",
            finConvention: "31/12/2028",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(
        screen.queryByText("Période d'autorisation en cours")
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Convention en cours/i)).toBeInTheDocument();
    });

    it("should not show optional label for convention", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.HUDA,
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(screen.queryByText(/\(optionnel\)/i)).not.toBeInTheDocument();
    });
  });

  describe("Autorisation period fields", () => {
    it("should render debut and fin autorisation fields", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            debutPeriodeAutorisation: "01/01/2024",
            finPeriodeAutorisation: "31/12/2028",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const dateLabels = screen.getAllByLabelText("Date de début");
      const datesFinLabels = screen.getAllByLabelText("Date de fin");

      expect(dateLabels[0]).toBeInTheDocument();
      expect(datesFinLabels[0]).toBeInTheDocument();
    });

    it("should update debut autorisation date", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            debutPeriodeAutorisation: "",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const debutInput = screen.getAllByLabelText("Date de début")[0];
      await user.type(debutInput, "2024-01-01");

      await waitFor(() => {
        expect(debutInput).toHaveValue("2024-01-01");
      });
    });

    it("should update fin autorisation date", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            finPeriodeAutorisation: "",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const finInput = screen.getAllByLabelText("Date de fin")[0];
      await user.type(finInput, "2028-12-31");

      await waitFor(() => {
        expect(finInput).toHaveValue("2028-12-31");
      });
    });
  });

  describe("Convention fields", () => {
    it("should render debut and fin convention fields and update them", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CPH,
            debutConvention: "01/01/2024",
            finConvention: "31/12/2028",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(screen.getAllByLabelText("Date de début").length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByLabelText("Date de fin").length).toBeGreaterThan(0);

      const debutInput = screen.getAllByLabelText("Date de début")[0];
      await user.type(debutInput, "2024-01-15");

      await waitFor(() => {
        expect(debutInput).toHaveValue("2024-01-15");
      });
    });

    it("should update fin convention date", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CPH,

            finConvention: "",
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const finInput = screen.getAllByLabelText("Date de fin")[0];
      await user.type(finInput, "2028-06-30");

      await waitFor(() => {
        expect(finInput).toHaveValue("2028-06-30");
      });
    });
  });

  describe("Conditional rendering based on structure type", () => {
    const autoriseeTypes =
      Object.values(StructureType).filter(isStructureAutorisee);
    const subventionneeTypes = Object.values(StructureType).filter(
      isStructureSubventionnee
    );

    autoriseeTypes.forEach((type) => {
      it(`should show autorisation section for ${type}`, () => {
        render(
          <FormTestWrapper
            defaultValues={{
              type,
            }}
          >
            <FieldSetCalendrier />
          </FormTestWrapper>
        );

        expect(
          screen.getAllByLabelText(/Date de début/i).length
        ).toBeGreaterThanOrEqual(1);
      });
    });

    subventionneeTypes.forEach((type) => {
      it(`should not show autorisation section for ${type}`, () => {
        render(
          <FormTestWrapper
            defaultValues={{
              type,
            }}
          >
            <FieldSetCalendrier />
          </FormTestWrapper>
        );

        expect(
          screen.queryByText("Période d'autorisation en cours")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle CADA showing all sections", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      const datesDebuts = screen.getAllByLabelText(/Date de début/i);
      const datesFins = screen.getAllByLabelText(/Date de fin/i);

      expect(datesDebuts.length).toBe(2);
      expect(datesFins.length).toBe(2);
    });

    it("should handle HUDA showing only convention", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.HUDA,
          }}
        >
          <FieldSetCalendrier />
        </FormTestWrapper>
      );

      expect(
        screen.queryByText("Période d'autorisation en cours")
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Convention en cours/i)).toBeInTheDocument();

      const dateInputs = screen.getAllByLabelText("Date de début");
      expect(dateInputs.length).toBe(1);
    });
  });
});
