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
  const structure = createStructure({ id: 1 });

  const renderFieldSet = (
    defaultValues: Record<string, unknown>,
    overrides?: Partial<typeof structure>,
    formKind: FormKind = FormKind.FINALISATION
  ) =>
    render(
      <FormTestWrapper defaultValues={defaultValues}>
        <FieldSetTypePlaces
          structure={overrides ? { ...structure, ...overrides } : structure}
          formKind={formKind}
        />
      </FormTestWrapper>
    );

  const filledYears = years.map((year) => ({
    year,
    placesAutorisees: 0,
    pmr: 0,
    lgbt: 0,
    fvvTeh: 0,
  }));

  describe("Rendering finalisation form", () => {
    it("affiche la légende Types de place", () => {
      renderFieldSet({ structureTypologies: filledYears });
      expect(screen.getByText("Types de place")).toBeInTheDocument();
    });

    it("affiche les années en en-têtes de colonnes", () => {
      renderFieldSet({ structureTypologies: filledYears });
      years.forEach((year) => {
        expect(
          screen.getByRole("columnheader", { name: year.toString() })
        ).toBeInTheDocument();
      });
    });

    it("affiche une ligne par type de place avec les libellés labellisées/spécialisées", () => {
      renderFieldSet({ structureTypologies: filledYears });
      expect(screen.getByText("Places autorisées")).toBeInTheDocument();
      expect(screen.getByText("Places PMR")).toBeInTheDocument();
      expect(screen.getByText("Places LGBT")).toBeInTheDocument();
      expect(screen.getByText("(labellisées)")).toBeInTheDocument();
      expect(screen.getByText("Places FVV/TEH")).toBeInTheDocument();
      expect(screen.getByText("(spécialisées)")).toBeInTheDocument();
    });

    it("affiche le texte d'instruction, y compris la règle contraction/extension", () => {
      renderFieldSet({ structureTypologies: [] });
      expect(
        screen.getByText(
          /Veuillez renseigner l’historique du nombre de places/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/passer par une\s+contraction ou une extension/i)
      ).toBeInTheDocument();
    });

    it("affiche la légende PMR/LGBT/FVV", () => {
      renderFieldSet({ structureTypologies: [] });
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
      renderFieldSet(
        { structureTypologies: filledYears },
        undefined,
        FormKind.MODIFICATION
      );
      expect(screen.getByText("Détails et historique")).toBeInTheDocument();
      expect(screen.queryByText("Types de place")).not.toBeInTheDocument();
    });
  });

  describe("Form inputs", () => {
    it("affiche tous les champs de saisie pour chaque année", () => {
      const { container } = renderFieldSet({ structureTypologies: filledYears });
      years.forEach((_, index) => {
        ["placesAutorisees", "pmr", "lgbt", "fvvTeh"].forEach((field) => {
          expect(
            container.querySelector(
              `[name="structureTypologies.${index}.${field}"]`
            )
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe("Number inputs", () => {
    it("accepte des valeurs numériques pour placesAutorisees des années legacy", async () => {
      const user = userEvent.setup();
      const { container } = renderFieldSet({ structureTypologies: filledYears });

      // index 1 = 2025 (< seuil, éditable) ; index 0 = 2026 est en lecture seule.
      const input = container.querySelector(
        '[name="structureTypologies.1.placesAutorisees"]'
      ) as HTMLInputElement;

      expect(input).toHaveAttribute("min", "0");

      await user.clear(input);
      await user.type(input, "100");

      await waitFor(() => {
        expect(input).toHaveValue("100");
      });
    });

    it("verrouille placesAutorisees à partir du seuil de versionnement", () => {
      const { container } = renderFieldSet({ structureTypologies: filledYears });

      // index 0 = 2026 (≥ seuil) verrouillé, index 1 = 2025 éditable.
      expect(
        container.querySelector(
          '[name="structureTypologies.0.placesAutorisees"]'
        )
      ).toBeDisabled();
      expect(
        container.querySelector(
          '[name="structureTypologies.1.placesAutorisees"]'
        )
      ).not.toBeDisabled();
    });
  });

  describe("Data for multiple years", () => {
    it("gère des valeurs différentes pour chaque année", () => {
      const { container } = renderFieldSet(
        {
          structureTypologies: [
            { year: 2026, placesAutorisees: 100, pmr: 10, lgbt: 5, fvvTeh: 3 },
            { year: 2025, placesAutorisees: 95, pmr: 8, lgbt: 4, fvvTeh: 2 },
            { year: 2024, placesAutorisees: 90, pmr: 7, lgbt: 3, fvvTeh: 1 },
            { year: 2023, placesAutorisees: 90, pmr: 7, lgbt: 3, fvvTeh: 1 },
          ],
        },
        // Transfo en cours : le mirror est coupé, chaque cellule garde sa valeur.
        { isCurrentVersionFromTransformation: true }
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
      }));

      expect(inputs[0].placesAutorisees).toHaveValue("100");
      expect(inputs[0].pmr).toHaveValue("10");
      expect(inputs[1].placesAutorisees).toHaveValue("95");
      expect(inputs[2].lgbt).toHaveValue("3");
    });

    it("reflète l'année legacy sur la cellule ≥ seuil hors transfo", async () => {
      const user = userEvent.setup();
      const { container } = renderFieldSet({
        structureTypologies: [
          { year: 2026, placesAutorisees: 100, pmr: 0, lgbt: 0, fvvTeh: 0 },
          { year: 2025, placesAutorisees: 95, pmr: 0, lgbt: 0, fvvTeh: 0 },
        ],
      });

      const places2026 = container.querySelector(
        '[name="structureTypologies.0.placesAutorisees"]'
      ) as HTMLInputElement;
      const places2025 = container.querySelector(
        '[name="structureTypologies.1.placesAutorisees"]'
      ) as HTMLInputElement;

      // Au montage, la cellule 2026 (verrouillée) suit déjà 2025.
      await waitFor(() => expect(places2026).toHaveValue("95"));

      // Éditer 2025 met à jour 2026 en direct.
      await user.clear(places2025);
      await user.type(places2025, "120");
      await waitFor(() => expect(places2026).toHaveValue("120"));
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
