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
  it("renders the type de bâti select with every répartition option", () => {
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

  it("shows the transformation banner and the public select for an extension", () => {
    renderFieldSet(FormKind.EXTENSION);

    expect(screen.getByText(/extension effective/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Public" })
    ).toBeInTheDocument();
  });

  it("uses the contraction wording in the banner for a contraction", () => {
    renderFieldSet(FormKind.CONTRACTION);

    expect(screen.getByText(/contraction effective/i)).toBeInTheDocument();
  });

  it("hides the banner and the public select outside transformation/creation", () => {
    renderFieldSet(FormKind.FINALISATION);

    expect(screen.queryByText(/effective/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Public" })
    ).not.toBeInTheDocument();
  });
});
