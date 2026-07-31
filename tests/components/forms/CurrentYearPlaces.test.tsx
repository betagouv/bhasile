import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurrentYearPlaces } from "@/app/components/forms/typePlace/CurrentYearPlaces";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const renderWithTotal = (
  props: { formKind: FormKind; originalPlaces?: number },
  total: number
) =>
  render(
    <FormTestWrapper
      defaultValues={{
        structureTypologies: [{ placesAutorisees: total, year: 2026 }],
      }}
    >
      <CurrentYearPlaces {...props} />
    </FormTestWrapper>
  );

describe("CurrentYearPlaces", () => {
  it("affiche le delta « nouvelles places » pour une extension", () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 50);

    expect(screen.getByText(/soit 3 nouvelles places/)).toBeInTheDocument();
  });

  it("accorde le delta au singulier pour une extension d'une seule place", () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 48);

    expect(screen.getByText(/soit 1 nouvelle place/)).toBeInTheDocument();
  });

  it("affiche le delta « places en moins » pour une contraction", () => {
    renderWithTotal({ formKind: FormKind.CONTRACTION, originalPlaces: 47 }, 40);

    expect(screen.getByText(/soit 7 places en moins/)).toBeInTheDocument();
  });

  it("accorde le delta au singulier pour une contraction d'une seule place", () => {
    renderWithTotal({ formKind: FormKind.CONTRACTION, originalPlaces: 47 }, 46);

    expect(screen.getByText(/soit 1 place en moins/)).toBeInTheDocument();
  });

  it("n'affiche aucun message sans originalPlaces (création)", () => {
    renderWithTotal({ formKind: FormKind.OUVERTURE_EX_NIHILO }, 50);

    expect(screen.queryByText(/soit .* place/)).not.toBeInTheDocument();
  });

  it("ne signale pas la contradiction tant que le champ n'a pas été quitté", () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 40);

    expect(screen.queryByText(/doit être supérieur/)).not.toBeInTheDocument();
  });

  it("affiche une erreur et masque le delta quand une extension diminue les places après un blur", async () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 40);

    fireEvent.blur(screen.getByLabelText(/Nombre total de places autorisées/));

    expect(
      await screen.findByText(
        /doit être supérieur au nombre de places précédent \(47\)/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/soit .* place/)).not.toBeInTheDocument();
  });

  it("signale l'incohérence quand l'utilisateur ramène les places au total précédent", async () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 50);

    const input = screen.getByLabelText(/Nombre total de places autorisées/);
    fireEvent.change(input, { target: { value: "47" } });
    fireEvent.blur(input);

    expect(
      await screen.findByText(
        /doit être supérieur au nombre de places précédent \(47\)/
      )
    ).toBeInTheDocument();
  });

  it("ne signale pas l'égalité tant que le champ n'a pas été modifié", () => {
    renderWithTotal({ formKind: FormKind.EXTENSION, originalPlaces: 47 }, 47);

    fireEvent.blur(screen.getByLabelText(/Nombre total de places autorisées/));

    expect(screen.queryByText(/doit être supérieur/)).not.toBeInTheDocument();
  });

  it("ne signale pas de contradiction quand le champ est vide", () => {
    render(
      <FormTestWrapper
        defaultValues={{
          structureTypologies: [{ placesAutorisees: "", year: 2026 }],
        }}
      >
        <CurrentYearPlaces formKind={FormKind.EXTENSION} originalPlaces={47} />
      </FormTestWrapper>
    );

    expect(screen.queryByText(/doit être supérieur/)).not.toBeInTheDocument();
  });
});
