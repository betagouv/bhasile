import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ManualAddressInputs } from "@/app/components/forms/adresseAdministrativeAndAntenne/ManualAddressInputs";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

describe("ManualAddressInputs", () => {
  it("ne déduit le département du code postal qu'une fois celui-ci complet", async () => {
    const onSubmit = vi.fn();
    render(
      <FormTestWrapper
        defaultValues={{
          codePostalAdministratif: "",
          departementAdministratif: "75",
        }}
        onSubmit={onSubmit}
      >
        <ManualAddressInputs />
      </FormTestWrapper>
    );
    const codePostalInput = screen.getByLabelText("Code postal");
    const submitButton = screen.getByRole("button", { name: "Valider" });

    await userEvent.type(codePostalInput, "1300");
    await userEvent.click(submitButton);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ departementAdministratif: "75" }),
        expect.anything()
      )
    );

    await userEvent.type(codePostalInput, "1");
    await userEvent.click(submitButton);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ departementAdministratif: "13" }),
        expect.anything()
      )
    );
  });

  it("déduit le département d'un code postal complet précédé d'un espace", async () => {
    const onSubmit = vi.fn();
    render(
      <FormTestWrapper
        defaultValues={{
          codePostalAdministratif: "",
          departementAdministratif: "75",
        }}
        onSubmit={onSubmit}
      >
        <ManualAddressInputs />
      </FormTestWrapper>
    );

    await userEvent.type(screen.getByLabelText("Code postal"), " 92100");
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ departementAdministratif: "92" }),
        expect.anything()
      )
    );
  });
});
