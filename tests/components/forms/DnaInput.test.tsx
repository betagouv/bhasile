import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DnaInput } from "@/app/components/forms/adresseAdministrativeAndAntenne/DnaInput";
import { ManualAddressInputs } from "@/app/components/forms/adresseAdministrativeAndAntenne/ManualAddressInputs";
import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";
import { StructureType } from "@/types/structure.type";

import { FormTestWrapper } from "../../test-utils/form-test-wrapper";

vi.mock("@/app/hooks/useFetchFreeDnaCodes", () => ({
  useFetchFreeDnaCodes: vi.fn(),
}));

const mockedUseFetchFreeDnaCodes = vi.mocked(useFetchFreeDnaCodes);

const defaultValues = {
  operateur: { id: 3, name: "Opérateur" },
  departementAdministratif: "75",
  type: StructureType.CADA,
  dnaStructures: [{ description: "", dna: { code: "C0002" } }],
};

describe("DnaInput", () => {
  beforeEach(() => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({
      freeDnaCodes: [
        { code: "C0001", departementAdministratif: "75" },
        { code: "C0002", departementAdministratif: "75" },
      ],
    });
  });

  it("vide le code sélectionné quand il ne figure plus dans la liste", async () => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({
      freeDnaCodes: [{ code: "C0001", departementAdministratif: "75" }],
    });
    const onSubmit = vi.fn();

    render(
      <FormTestWrapper defaultValues={defaultValues} onSubmit={onSubmit}>
        <DnaInput index={0} label="Code DNA" />
      </FormTestWrapper>
    );
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dnaStructures: [{ description: "", dna: { code: "" } }],
        }),
        expect.anything()
      )
    );
  });

  it("garde le code sélectionné tant que la liste n'est pas chargée", async () => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({ freeDnaCodes: undefined });
    const onSubmit = vi.fn();

    render(
      <FormTestWrapper defaultValues={defaultValues} onSubmit={onSubmit}>
        <DnaInput index={0} label="Code DNA" />
      </FormTestWrapper>
    );
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dnaStructures: [{ description: "", dna: { code: "C0002" } }],
        }),
        expect.anything()
      )
    );
  });

  it("garde le code sélectionné d'un champ désactivé même absent de la liste", async () => {
    mockedUseFetchFreeDnaCodes.mockReturnValue({ freeDnaCodes: [] });
    const onSubmit = vi.fn();

    render(
      <FormTestWrapper defaultValues={defaultValues} onSubmit={onSubmit}>
        <DnaInput index={0} label="Code DNA" disabled />
      </FormTestWrapper>
    );
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dnaStructures: [{ description: "", dna: { code: "C0002" } }],
        }),
        expect.anything()
      )
    );
  });

  it("recharge les codes avec le nouveau département quand l'adresse change", async () => {
    render(
      <FormTestWrapper defaultValues={defaultValues}>
        <ManualAddressInputs />
        <DnaInput index={0} label="Code DNA" />
      </FormTestWrapper>
    );

    await userEvent.type(screen.getByLabelText("Code postal"), "13001");

    await waitFor(() =>
      expect(mockedUseFetchFreeDnaCodes).toHaveBeenLastCalledWith(
        expect.objectContaining({ departementAdministratif: "13" })
      )
    );
  });
});
