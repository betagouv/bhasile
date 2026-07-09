import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStructure } from "tests/test-utils/structure.factory";
import { describe, expect, it } from "vitest";

import { FieldSetTypePlaces } from "@/app/components/forms/typePlace/FieldSetTypePlaces";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

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
    it("affiche la légende Types de place", () => {
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

    it("affiche les années en en-têtes de colonnes", () => {
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
        expect(
          screen.getByRole("columnheader", { name: year.toString() })
        ).toBeInTheDocument();
      });
    });

    it("affiche une ligne par type de place avec les libellés labellisées/spécialisées", () => {
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

      expect(screen.getByText("Places autorisées")).toBeInTheDocument();
      expect(screen.getByText("Places PMR")).toBeInTheDocument();
      expect(screen.getByText("Places LGBT")).toBeInTheDocument();
      expect(screen.getByText("(labellisées)")).toBeInTheDocument();
      expect(screen.getByText("Places FVV/TEH")).toBeInTheDocument();
      expect(screen.getByText("(spécialisées)")).toBeInTheDocument();
    });

    it("affiche une colonne par année", () => {
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

    it("affiche le texte d'instruction", () => {
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

    it("affiche la légende PMR/LGBT/FVV", () => {
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
    it("affiche la légende Détails et historique", () => {
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
    it("affiche tous les champs de saisie pour chaque année", () => {
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

  });

  describe("Number inputs", () => {
    it("accepte des valeurs numériques pour placesAutorisees", async () => {
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
    it("gère des valeurs différentes pour chaque année", async () => {
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

  describe("Soumission", () => {
    it("conserve id et year dans le payload sans champ caché rendu", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      const { container } = render(
        <FormTestWrapper
          defaultValues={{
            structureTypologies: years.map((year, index) => ({
              id: index + 1,
              year,
              placesAutorisees: 0,
              pmr: 0,
              lgbt: 0,
              fvvTeh: 0,
            })),
          }}
          onSubmit={onSubmit}
        >
          <FieldSetTypePlaces
            structure={structure}
            formKind={FormKind.FINALISATION}
          />
        </FormTestWrapper>
      );

      expect(
        container.querySelector('[name="structureTypologies.0.id"]')
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('[name="structureTypologies.0.year"]')
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Valider" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submitted = onSubmit.mock.calls[0][0].structureTypologies;
      years.forEach((year, index) => {
        expect(submitted[index]).toMatchObject({ id: index + 1, year });
      });
    });
  });
});
