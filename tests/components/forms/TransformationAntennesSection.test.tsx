import { fireEvent, render, screen } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { TransformationAntennesSection } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAntennesSection";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/components/forms/AddressWithValidation", () => ({
  default: () => <div data-testid="address-field" />,
}));

const IsMultiAntenneProbe = () => {
  const { watch } = useFormContext();
  return <span data-testid="is-multi-antenne">{String(watch("isMultiAntenne"))}</span>;
};

const renderSection = (defaultValues: Record<string, unknown> = {}) =>
  render(
    <FormTestWrapper defaultValues={defaultValues}>
      <TransformationAntennesSection formKind={FormKind.EXTENSION} />
      <IsMultiAntenneProbe />
    </FormTestWrapper>
  );

const existingAntennes = [
  {
    name: "Avranches Nord",
    adresse: "1 rue A",
    codePostal: "50300",
    commune: "Avranches",
  },
  {
    name: "Avranches Sud",
    adresse: "2 rue B",
    codePostal: "50300",
    commune: "Avranches",
  },
];

const clickRadio = (label: "Oui" | "Non") =>
  fireEvent.click(screen.getByRole("radio", { name: label }));

describe("TransformationAntennesSection", () => {
  it("n'affiche aucune réponse cochée ni les inputs par défaut", () => {
    renderSection();

    expect(screen.getByRole("radio", { name: "Oui" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Non" })).not.toBeChecked();
    expect(screen.queryByText("Sites administratifs")).not.toBeInTheDocument();
  });

  it("affiche 2 sites vides quand on répond Oui sur une structure sans antenne", () => {
    renderSection();

    clickRadio("Oui");

    expect(screen.getByText("Sites administratifs")).toBeInTheDocument();
    expect(
      screen.getAllByRole("textbox", { name: "Nom du site" })
    ).toHaveLength(2);
  });

  it("masque les inputs quand on répond Non, sans afficher d'antenne", () => {
    renderSection();

    clickRadio("Oui");
    clickRadio("Non");

    expect(screen.queryByText("Sites administratifs")).not.toBeInTheDocument();
  });

  it("pré-remplit les antennes existantes sur Oui, masquées par défaut", () => {
    renderSection({ antennes: existingAntennes });

    expect(screen.queryByText("Sites administratifs")).not.toBeInTheDocument();

    clickRadio("Oui");

    expect(screen.getByDisplayValue("Avranches Nord")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Avranches Sud")).toBeInTheDocument();
  });

  it("restaure le snapshot initial et jette l'édition au retour sur Non", () => {
    renderSection({ antennes: existingAntennes });

    clickRadio("Oui");
    const firstName = screen.getByDisplayValue("Avranches Nord");
    fireEvent.change(firstName, { target: { value: "Site modifié" } });
    expect(screen.getByDisplayValue("Site modifié")).toBeInTheDocument();

    clickRadio("Non");
    clickRadio("Oui");

    expect(screen.getByDisplayValue("Avranches Nord")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Site modifié")).not.toBeInTheDocument();
  });

  it("garde isMultiAntenne à true quand la structure a des antennes, inputs masqués", () => {
    renderSection({ antennes: existingAntennes });

    expect(screen.queryByText("Sites administratifs")).not.toBeInTheDocument();
    expect(screen.getByTestId("is-multi-antenne")).toHaveTextContent("true");
  });

  it("garde isMultiAntenne à false quand la structure n'a aucune antenne", () => {
    renderSection();

    expect(screen.getByTestId("is-multi-antenne")).toHaveTextContent("false");
  });
});
