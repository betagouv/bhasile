import { fireEvent, render, screen } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { TransformationAntennesSection } from "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAntennesSection";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/components/forms/AddressWithValidation", () => ({
  default: () => <div data-testid="address-field" />,
}));

const IsMultiAntenneProbe = () => {
  const { watch } = useFormContext();
  return (
    <span data-testid="is-multi-antenne">{String(watch("isMultiAntenne"))}</span>
  );
};

const makeAntenne = (name: string): AntenneFormValues => ({
  name,
  adresse: "1 rue X",
  codePostal: "50300",
  commune: "Avranches",
});

const renderSection = (
  defaultValues: Record<string, unknown> = {},
  originalAntennes: AntenneFormValues[] = []
) =>
  render(
    <FormTestWrapper defaultValues={defaultValues}>
      <TransformationAntennesSection
        formKind={FormKind.EXTENSION}
        originalAntennes={originalAntennes}
      />
      <IsMultiAntenneProbe />
    </FormTestWrapper>
  );

const clickRadio = (label: "Oui" | "Non") =>
  fireEvent.click(screen.getByRole("radio", { name: label }));

const nomInput = (value: string) => screen.getByDisplayValue(value);

describe("TransformationAntennesSection", () => {
  it("coche Non par défaut et affiche les antennes préremplies en disabled", () => {
    renderSection({ antennes: [makeAntenne("Avranches Nord")] }, [
      makeAntenne("Avranches Nord"),
    ]);

    expect(screen.getByRole("radio", { name: "Non" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Oui" })).not.toBeChecked();
    expect(nomInput("Avranches Nord")).toBeDisabled();
  });

  it("active les inputs quand on coche Oui", () => {
    renderSection({ antennes: [makeAntenne("Avranches Nord")] }, [
      makeAntenne("Avranches Nord"),
    ]);

    clickRadio("Oui");

    expect(nomInput("Avranches Nord")).not.toBeDisabled();
  });

  it("restaure le prefill et jette l'édition quand on recoche Non", () => {
    renderSection({ antennes: [makeAntenne("Avranches Nord")] }, [
      makeAntenne("Avranches Nord"),
    ]);

    clickRadio("Oui");
    fireEvent.change(nomInput("Avranches Nord"), {
      target: { value: "Édité" },
    });
    expect(nomInput("Édité")).toBeInTheDocument();

    clickRadio("Non");

    expect(nomInput("Avranches Nord")).toBeDisabled();
    expect(screen.queryByDisplayValue("Édité")).not.toBeInTheDocument();
  });

  it("coche Oui à la reprise quand les antennes persistées diffèrent du prefill", () => {
    renderSection({ antennes: [makeAntenne("Édité")] }, [
      makeAntenne("Original"),
    ]);

    expect(screen.getByRole("radio", { name: "Oui" })).toBeChecked();
    expect(nomInput("Édité")).not.toBeDisabled();
  });

  it("prefill vide : message à la place des inputs par défaut, 2 lignes vides éditables sur Oui", () => {
    renderSection();

    expect(
      screen.queryByRole("textbox", { name: "Nom du site" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/n.est pas répartie en plusieurs sites administratifs/i)
    ).toBeInTheDocument();

    clickRadio("Oui");

    expect(
      screen.queryByText(/n.est pas répartie en plusieurs sites administratifs/i)
    ).not.toBeInTheDocument();
    const nomInputs = screen.getAllByRole("textbox", { name: "Nom du site" });
    expect(nomInputs).toHaveLength(2);
    nomInputs.forEach((input) => expect(input).not.toBeDisabled());
  });

  it("prefill vide : recocher Non fait disparaître le fieldset", () => {
    renderSection();

    clickRadio("Oui");
    expect(
      screen.getAllByRole("textbox", { name: "Nom du site" }).length
    ).toBeGreaterThan(0);

    clickRadio("Non");

    expect(
      screen.queryByRole("textbox", { name: "Nom du site" })
    ).not.toBeInTheDocument();
  });

  it("garde isMultiAntenne à true quand la structure a des antennes", () => {
    renderSection({ antennes: [makeAntenne("Avranches Nord")] }, [
      makeAntenne("Avranches Nord"),
    ]);

    expect(screen.getByTestId("is-multi-antenne")).toHaveTextContent("true");
  });

  it("garde isMultiAntenne à false quand la structure n'a aucune antenne", () => {
    renderSection();

    expect(screen.getByTestId("is-multi-antenne")).toHaveTextContent("false");
  });
});
