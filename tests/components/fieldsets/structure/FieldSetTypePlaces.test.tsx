import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStructure } from "tests/test-utils/structure.factory";
import { describe, expect, it } from "vitest";

import { FieldSetTypePlaces } from "@/app/components/forms/fieldsets/structure/FieldSetTypePlaces";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../../test-utils/form-test-wrapper";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2026,
  };
});

describe("FieldSetTypePlaces", () => {
  const years = [2026, 2025, 2024, 2023];
  const structure = createStructure({
    id: 1,
  });
  describe("Rendering finalisation form", () => {
    it("should render with Types de place legend", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      expect(screen.getByText("Types de place")).toBeInTheDocument();
    });

    it("should render table headers", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      expect(screen.getByText("Année")).toBeInTheDocument();
      expect(screen.getByText("Autorisées")).toBeInTheDocument();
      expect(screen.getByText("PMR")).toBeInTheDocument();
      expect(screen.getByText("LGBT")).toBeInTheDocument();
      expect(screen.getByText("FVV/TEH")).toBeInTheDocument();
    });

    it("should render rows for each year", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      years.forEach((year) => {
        expect(screen.getByText(year.toString())).toBeInTheDocument();
      });
    });

    it("should display instruction text", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: [],
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(
          /Veuillez renseigner l’historique du nombre de places/i
        )
      ).toBeInTheDocument();
    });

    it("should display PMR/LGBT/FVV notice", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: [],
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      expect(
        screen.getByText(/PMR : Personnes à Mobilité Réduite/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/LGBT : Lesbiennes, Gays, Bisexuels et Transgenres/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/FVV : Femmes Victimes de Violences/i)
      ).toBeInTheDocument();
    });
  });

  describe("Rendering modification form", () => {
    it("should render with Détails et historique legend", () => {
      render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.MODIFICATION}
          />
        </FormTestWrapper>
      );

      expect(screen.getByText("Détails et historique")).toBeInTheDocument();
      expect(screen.queryByText("Types de place")).not.toBeInTheDocument();
    });
  });

  describe("Form inputs", () => {
    it("should render all input fields for each year", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      years.forEach((_, index) => {
        expect(
          container.querySelector(
            `[name="structureTypologies.${index}.placesAutorisees"]`
          )
        ).toBeInTheDocument();
        expect(
          container.querySelector(`[name="structureTypologies.${index}.pmr"]`)
        ).toBeInTheDocument();
        expect(
          container.querySelector(`[name="structureTypologies.${index}.lgbt"]`)
        ).toBeInTheDocument();
        expect(
          container.querySelector(
            `[name="structureTypologies.${index}.fvvTeh"]`
          )
        ).toBeInTheDocument();
      });
    });

    it("should have hidden date fields for each year", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      years.forEach((_, index) => {
        const dateInput = container.querySelector(
          `input[name="structureTypologies.${index}.year"]`
        );
        expect(dateInput).toBeInTheDocument();
        expect(dateInput).toHaveAttribute("type", "hidden");
      });
    });
  });

  describe("Number inputs", () => {
    it("should accept numeric values for placesAutorisees", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year) => ({
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      const input = container.querySelector(
        '[name="structureTypologies.0.placesAutorisees"]'
      ) as HTMLInputElement;

      expect(input).toHaveAttribute("min", "0");

      await user.clear(input);
      await user.type(input, "100");

      await waitFor(() => {
        expect(input).toHaveValue("100");
      });
    });
  });

  describe("Data for multiple years", () => {
    it("should handle different values for each year", async () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: [
              {
                year: 2026,
                placesAutorisees: 100,
                pmr: 10,
                lgbt: 5,
                fvvTeh: 3,
              },
              { year: 2025, placesAutorisees: 95, pmr: 8, lgbt: 4, fvvTeh: 2 },
              { year: 2024, placesAutorisees: 90, pmr: 7, lgbt: 3, fvvTeh: 1 },
              { year: 2023, placesAutorisees: 90, pmr: 7, lgbt: 3, fvvTeh: 1 },
            ],
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      const inputs = [0, 1, 2].map((index) => ({
        placesAutorisees: container.querySelector(
          `[name="structureTypologies.${index}.placesAutorisees"]`
        ) as HTMLInputElement,
        pmr: container.querySelector(
          `[name="structureTypologies.${index}.pmr"]`
        ) as HTMLInputElement,
        lgbt: container.querySelector(
          `[name="structureTypologies.${index}.lgbt"]`
        ) as HTMLInputElement,
        fvvTeh: container.querySelector(
          `[name="structureTypologies.${index}.fvvTeh"]`
        ) as HTMLInputElement,
      }));

      expect(inputs[0].placesAutorisees).toHaveValue("100");
      expect(inputs[0].pmr).toHaveValue("10");
      expect(inputs[1].placesAutorisees).toHaveValue("95");
      expect(inputs[2].lgbt).toHaveValue("3");
    });
  });

  describe("Hidden ID fields", () => {
    it("should have hidden id fields when provided", () => {
      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year, index) => ({
              year,
              id: index + 1,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      years.forEach((_, index) => {
        expect(
          container.querySelector(`[name="structureTypologies.${index}.id"]`)
        ).toBeInTheDocument();
      });
    });
  });
});
