import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { FormKind } from "@/types/global";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

const renderFieldSet = (formKind?: FormKind) =>
  render(
    <FormTestWrapper defaultValues={{ typeBati: "", public: "" }}>
      <FieldSetTypeBati formKind={formKind} />
    </FormTestWrapper>
  );

describe("FieldSetTypeBati", () => {
  it("affiche le select type de bâti avec toutes les options de répartition", () => {
    renderFieldSet();

    const select = screen.getByRole("combobox", { name: "Type de bâti" });
    expect(
      within(select).getByRole("option", { name: "Collectif" })
    ).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: "Diffus" })
    ).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: "Mixte" })
    ).toBeInTheDocument();
  });

  it("affiche le bandeau de transformation et le select public pour une extension", () => {
    renderFieldSet(FormKind.EXTENSION);

    expect(screen.getByText(/extension effective/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Public" })
    ).toBeInTheDocument();
  });

  it("emploie le libellé contraction dans le bandeau pour une contraction", () => {
    renderFieldSet(FormKind.CONTRACTION);

    expect(screen.getByText(/contraction effective/i)).toBeInTheDocument();
  });

  it("masque le bandeau et le select public hors transformation/création", () => {
    renderFieldSet(FormKind.FINALISATION);

    expect(screen.queryByText(/effective/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Public" })
    ).not.toBeInTheDocument();
  });
});
