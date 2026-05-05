import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { FormKind } from "@/types/global";
import { PublicType, StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/components/forms/autocomplete/OperateurAutocompleteRhf", () => ({
  OperateurAutocompleteRhf: () => <div data-testid="operateur-autocomplete" />,
}));

// Mock auto-animate
vi.mock("@formkit/auto-animate", () => ({
  default: vi.fn(),
}));

describe("FieldSetDescription", () => {
  describe("Rendering finalisation form", () => {
    it("should render all fields correctly", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            dnaCode: "C0001",
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            filiale: "",
            creationDate: "01/01/2020",
            public: PublicType.TOUT_PUBLIC,
            lgbt: false,
            fvvTeh: false,
            cpom: false,
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.getByText("Description")).toBeInTheDocument();

      expect(
        screen.getByRole("checkbox", {
          name: /Cette structure appartient-elle à une filiale/i,
        })
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Type")).toBeInTheDocument();

      expect(screen.getByTestId("operateur-autocomplete")).toBeInTheDocument();

      expect(
        screen.getByLabelText("Date de création de la structure")
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Public")).toBeInTheDocument();

      const lgbtTexts = screen.getAllByText(/LGBT/i);
      expect(lgbtTexts.length).toBeGreaterThan(0);

      expect(screen.getByLabelText("LGBT")).toBeInTheDocument();

      expect(screen.getByLabelText("FVV et TEH")).toBeInTheDocument();
    });

    it("should have all public type options", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const publicSelect = screen.getByLabelText("Public") as HTMLSelectElement;
      const options = Array.from(publicSelect.options).map((opt) => opt.value);

      expect(options).toContain(PublicType.TOUT_PUBLIC);
      expect(options).toContain(PublicType.FAMILLE);
      expect(options).toContain(PublicType.PERSONNES_ISOLEES);
    });
  });

  describe("Rendering modification form", () => {
    it("should render with Général legend", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(screen.getByText("Général")).toBeInTheDocument();
    });

    it("should not render filiale toggle and creation date", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.MODIFICATION} />
        </FormTestWrapper>
      );

      expect(
        screen.queryByText(/Cette structure appartient-elle à une filiale/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Date de création de la structure")
      ).not.toBeInTheDocument();
    });
  });

  describe("Filiale toggle interaction", () => {
    it("should show filiale input when toggle is activated", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            filiale: "",
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.queryByLabelText("Filiale")).not.toBeInTheDocument();

      const toggle = screen.getByRole("checkbox", {
        name: /Cette structure appartient-elle à une filiale/i,
      });
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByLabelText("Filiale")).toBeInTheDocument();
      });
    });

    it("should hide filiale input when toggle is deactivated", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            filiale: "",
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const toggle = screen.getByRole("checkbox", {
        name: /Cette structure appartient-elle à une filiale/i,
      });

      // First click - show filiale field
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByLabelText("Filiale")).toBeInTheDocument();
      });

      // Second click - hide filiale field
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.queryByLabelText("Filiale")).not.toBeInTheDocument();
      });
    });
  });

  describe("LGBT and FVV/TEH checkboxes", () => {
    it("should toggle LGBT checkbox", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            lgbt: false,
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const lgbtCheckbox = screen.getByLabelText("LGBT") as HTMLInputElement;
      expect(lgbtCheckbox.checked).toBe(false);

      await user.click(lgbtCheckbox);

      await waitFor(() => {
        expect(lgbtCheckbox.checked).toBe(true);
      });
    });

    it("should toggle FVV/TEH checkbox", async () => {
      const user = userEvent.setup();

      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            fvvTeh: false,
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const fvvTehCheckbox = screen.getByLabelText(
        "FVV et TEH"
      ) as HTMLInputElement;
      expect(fvvTehCheckbox.checked).toBe(false);

      await user.click(fvvTehCheckbox);

      await waitFor(() => {
        expect(fvvTehCheckbox.checked).toBe(true);
      });
    });
  });

  describe("Type selection", () => {
    it("should have all structure types except PRAHDA", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const typeSelect = screen.getByLabelText("Type") as HTMLSelectElement;
      const options = Array.from(typeSelect.options).map((opt) => opt.value);

      expect(options).toContain(StructureType.CADA);
      expect(options).toContain(StructureType.HUDA);
      expect(options).toContain(StructureType.CPH);
      expect(options).toContain(StructureType.CAES);
      expect(options).not.toContain(StructureType.PRAHDA);
    });

    it("should have type select with structure types", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.HUDA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      const typeSelect = screen.getByLabelText("Type") as HTMLSelectElement;
      expect(typeSelect).toBeInTheDocument();
      expect(typeSelect.value).toBe(StructureType.HUDA);
    });
  });

  describe("Notice display", () => {
    it("should display LGBT/FVV/TEH explanation notice", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/LGBT : Lesbiennes, Gays, Bisexuels et Transgenres/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/FVV : Femmes Victimes de Violences/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/TEH : Traîte des Êtres Humains/i)
      ).toBeInTheDocument();
    });
  });
});
