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
    it("rend tous les champs correctement", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            dnaCode: "C0001",
            type: StructureType.CADA,
            operateur: { id: 1, name: "Adoma" },
            filiale: "",
            creationDate: "01/01/2020",
            public: PublicType.TOUT_PUBLIC,
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

      expect(screen.getByLabelText("Type de structure")).toBeInTheDocument();

      expect(screen.getByTestId("operateur-autocomplete")).toBeInTheDocument();

      expect(
        screen.getByLabelText("Date de création de la structure")
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Public")).toBeInTheDocument();
    });

    it("rend avec la légende Général", () => {
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
    it("rend avec la légende Général", () => {
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

    it("rend avec la légende Général", () => {
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
    it("affiche le champ filiale quand l'interrupteur est activé", async () => {
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

    it("affiche le champ filiale quand l'interrupteur est activé", async () => {
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

  describe("Type selection", () => {
    it("rend avec la légende Général", () => {
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

      const typeSelect = screen.getByLabelText(
        "Type de structure"
      ) as HTMLSelectElement;
      const options = Array.from(typeSelect.options).map((opt) => opt.value);

      expect(options).toContain(StructureType.CADA);
      expect(options).toContain(StructureType.HUDA);
      expect(options).toContain(StructureType.CPH);
      expect(options).toContain(StructureType.CAES);
      expect(options).not.toContain(StructureType.PRAHDA);
    });

    it("présélectionne le type de structure courant dans le sélecteur", () => {
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

      const typeSelect = screen.getByLabelText(
        "Type de structure"
      ) as HTMLSelectElement;
      expect(typeSelect).toBeInTheDocument();
      expect(typeSelect.value).toBe(StructureType.HUDA);
    });
  });

});
