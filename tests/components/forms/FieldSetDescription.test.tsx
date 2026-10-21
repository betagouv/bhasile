import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FieldSetDescription } from "@/app/components/forms/description/FieldSetDescription";
import { FormKind } from "@/types/global";
import { PublicType, StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/components/forms/autocomplete/OperateurAutocompleteRhf", () => ({
  OperateurAutocompleteRhf: () => <div data-testid="operateur-autocomplete" />,
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
            creationDate: "01/01/2020",
            public: PublicType.TOUT_PUBLIC,
            cpom: false,
          }}
        >
          <FieldSetDescription formKind={FormKind.FINALISATION} />
        </FormTestWrapper>
      );

      expect(screen.getByText("Description")).toBeInTheDocument();

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
        screen.queryByLabelText("Date de création de la structure")
      ).not.toBeInTheDocument();
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
      expect(options).not.toContain("PRAHDA");
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
