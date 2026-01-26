import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdressesRecovery } from "@/app/(password-protected)/ajout-adresses/[dnaCode]/01-adresses/_components/AdressesRecovery";
import { CURRENT_YEAR } from "@/constants";
import { RecoveryAdressesFormValues } from "@/schemas/forms/recovery-adresses/recoveryAdresses.schema";
import { Repartition } from "@/types/adresse.type";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUpdateStructure = vi.fn();
vi.mock("@/app/hooks/useStructures", () => ({
  useStructures: () => ({
    updateStructure: mockUpdateStructure,
  }),
}));

vi.mock("@/app/hooks/useAddressSuggestion", () => ({
  useAddressSuggestion: () => async (query: string) => {
    if (query.includes("Marseille") || query.includes("13001")) {
      return [
        {
          label: "789 Rue Diffus, 13001 Marseille",
          key: "marseille-1",
          score: 0.9,
          housenumber: "789",
          street: "Rue Diffus",
          postcode: "13001",
          city: "Marseille",
          context: "13, Bouches-du-Rhône",
          x: 5.36978,
          y: 43.296482,
        },
      ];
    }
    if (query.includes("Bordeaux") || query.includes("33000")) {
      return [
        {
          label: "111 Rue Mixte 1, 33000 Bordeaux",
          key: "bordeaux-1",
          score: 0.9,
          housenumber: "111",
          street: "Rue Mixte 1",
          postcode: "33000",
          city: "Bordeaux",
          context: "33, Gironde",
          x: -0.57918,
          y: 44.837789,
        },
        {
          label: "222 Rue Mixte 2, 33000 Bordeaux",
          key: "bordeaux-2",
          score: 0.9,
          housenumber: "222",
          street: "Rue Mixte 2",
          postcode: "33000",
          city: "Bordeaux",
          context: "33, Gironde",
          x: -0.57918,
          y: 44.837789,
        },
      ];
    }
    if (query.includes("Toulouse") || query.includes("31000")) {
      return [
        {
          label: "999 Rue Collectif, 31000 Toulouse",
          key: "toulouse-1",
          score: 0.9,
          housenumber: "999",
          street: "Rue Collectif",
          postcode: "31000",
          city: "Toulouse",
          context: "31, Haute-Garonne",
          x: 1.44367,
          y: 43.604652,
        },
      ];
    }
    return [];
  },
}));

// dsfr modal won't play nice with vitest, so we mock it
const mockAdressesRecoveryModal = vi.fn(
  ({ adressesRecoveredNumber }: { adressesRecoveredNumber: number }) => {
    return (
      <div data-testid="adresses-recovery-modal">
        <div data-testid="adresses-recovered-number">
          {adressesRecoveredNumber}
        </div>
      </div>
    );
  }
);

vi.mock(
  "@/app/(password-protected)/ajout-adresses/[dnaCode]/01-adresses/_components/AdressesRecoveryModal",
  () => ({
    AdressesRecoveryModal: (props: { adressesRecoveredNumber: number }) =>
      mockAdressesRecoveryModal(props),
  })
);

describe("AdressesRecovery", () => {
  const dnaCode = "TEST123";
  const localStorageKey = `ajout-structure-${dnaCode}-adresses`;

  const getSelectByName = (name: string): HTMLSelectElement => {
    const comboboxes = screen.getAllByRole("combobox");
    const select = comboboxes.find(
      (cb) => (cb as HTMLSelectElement).name === name
    ) as HTMLSelectElement;
    if (!select) {
      throw new Error(`Select with name="${name}" not found`);
    }
    return select;
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUpdateStructure.mockResolvedValue("OK");
    mockAdressesRecoveryModal.mockClear();
  });

  it("should display form without localStorage and not validate without any input (check modal with 'no adresses found')", async () => {
    // WHEN
    render(<AdressesRecovery dnaCode={dnaCode} />);

    await waitFor(() => {
      expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
    });

    // THEN - Verify the modal received the correct prop (0 addresses)
    expect(mockAdressesRecoveryModal).toHaveBeenCalledWith({
      adressesRecoveredNumber: 0,
    });
    expect(screen.getByTestId("adresses-recovered-number")).toHaveTextContent(
      "0"
    );

    const typeBatiSelect = getSelectByName("typeBati");
    expect(typeBatiSelect).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // Form shouldn't submit
    await waitFor(() => {
      expect(mockUpdateStructure).not.toHaveBeenCalled();
    });
  });

  it("should display form with new localStorage and validate (check modal with 'found adresses')", async () => {
    // GIVEN - New localStorage format with year attribute
    const newLocalStorageData: RecoveryAdressesFormValues = {
      typeBati: Repartition.DIFFUS,
      adresses: [
        {
          adresseComplete: "123 Rue Test, 75001 Paris",
          adresse: "123 Rue Test",
          codePostal: "75001",
          commune: "Paris",
          departement: "75",
          repartition: Repartition.DIFFUS,
          adresseTypologies: [
            {
              year: CURRENT_YEAR,
              placesAutorisees: 10,
              logementSocial: false,
              qpv: false,
            },
          ],
        },
      ],
    };

    localStorage.setItem(localStorageKey, JSON.stringify(newLocalStorageData));

    // WHEN
    render(<AdressesRecovery dnaCode={dnaCode} />);

    await waitFor(() => {
      expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
    });

    // THEN - Verify the modal received the correct prop (1 address)
    expect(mockAdressesRecoveryModal).toHaveBeenCalledWith({
      adressesRecoveredNumber: 1,
    });
    expect(screen.getByTestId("adresses-recovered-number")).toHaveTextContent(
      "1"
    );

    const typeBatiSelect = getSelectByName("typeBati");
    expect(typeBatiSelect.value).toBe(Repartition.DIFFUS);

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // Form should submit successfully
    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalled();
    });
  });

  it("should display form with old localStorage and validate", async () => {
    // GIVEN - Old localStorage format with date attribute
    const oldLocalStorageData = {
      typeBati: Repartition.COLLECTIF,
      adresses: [
        {
          adresseComplete: "456 Avenue Old, 69001 Lyon",
          adresse: "456 Avenue Old",
          codePostal: "69001",
          commune: "Lyon",
          departement: "69",
          repartition: Repartition.COLLECTIF,
          adresseTypologies: [
            {
              date: "01/01/2024", // Old format with date
              placesAutorisees: 20,
              logementSocial: true,
              qpv: false,
            },
          ],
        },
      ],
    };

    localStorage.setItem(localStorageKey, JSON.stringify(oldLocalStorageData));

    // WHEN
    render(<AdressesRecovery dnaCode={dnaCode} />);

    await waitFor(() => {
      expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
    });

    // THEN - Verify the modal received the correct prop (1 address)
    expect(mockAdressesRecoveryModal).toHaveBeenCalledWith({
      adressesRecoveredNumber: 1,
    });
    expect(screen.getByTestId("adresses-recovered-number")).toHaveTextContent(
      "1"
    );

    const typeBatiSelect = getSelectByName("typeBati");
    expect(typeBatiSelect.value).toBe(Repartition.COLLECTIF);

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // Form should submit successfully (date should be converted to year)
    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalled();
    });
  });

  it("should display form without localStorage, can input some adresses (in diffus) and validate", async () => {
    // WHEN
    render(<AdressesRecovery dnaCode={dnaCode} />);

    await waitFor(() => {
      expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
    });

    const typeBatiSelect = getSelectByName("typeBati");
    await userEvent.selectOptions(typeBatiSelect, Repartition.DIFFUS);

    const addressInput = screen.getByLabelText(/Adresse/i);
    await userEvent.type(addressInput, "789 Rue Diffus, 13001 Marseille");

    await waitFor(() => {
      const suggestion = screen.getByRole("option", {
        name: /789 Rue Diffus, 13001 Marseille/i,
      });
      expect(suggestion).toBeInTheDocument();
    });

    const suggestion = screen.getByRole("option", {
      name: /789 Rue Diffus, 13001 Marseille/i,
    });
    await userEvent.click(suggestion);

    const placesInput = screen.getByLabelText(/Places/i);
    await userEvent.clear(placesInput);
    await userEvent.type(placesInput, "15");

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // Form should submit successfully
    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalled();
    });
  });

  it.skip(
    "should display form without localStorage, can input some adresses (in mixte) and validate",
    async () => {
      // WHEN
      render(<AdressesRecovery dnaCode={dnaCode} />);

      // THEN - Verify the modal display correctly
      await waitFor(() => {
        expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
      });

      const typeBatiSelect = getSelectByName("typeBati");
      await userEvent.selectOptions(typeBatiSelect, Repartition.MIXTE);

      const addressInput = screen.getByLabelText(/Adresse/i);
      await userEvent.type(addressInput, "111 Rue Mixte 1, 33000 Bordeaux");

      await waitFor(() => {
        const suggestion = screen.getByRole("option", {
          name: /111 Rue Mixte 1, 33000 Bordeaux/i,
        });
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByRole("option", {
        name: /111 Rue Mixte 1, 33000 Bordeaux/i,
      });
      await userEvent.click(suggestion);

      const placesInput = screen.getByLabelText(/Places/i);
      await userEvent.clear(placesInput);
      await userEvent.type(placesInput, "5");

      // Get repartition selects from address components (they still have labels)
      const repartitionSelects = screen.getAllByLabelText(/Type de bâti/i);
      if (repartitionSelects.length > 1) {
        await userEvent.selectOptions(repartitionSelects[1], Repartition.DIFFUS);
      }

      const addAddressButton = screen.getByText(/Ajouter un hébergement/i);
      await userEvent.click(addAddressButton);

      await waitFor(() => {
        const addressInputs = screen.getAllByLabelText(/Adresse/i);
        expect(addressInputs.length).toBeGreaterThan(1);
      });

      const addressInputs = screen.getAllByLabelText(/Adresse/i);
      await userEvent.type(addressInputs[1], "222 Rue Mixte 2, 33000 Bordeaux");

    await waitFor(() => {
      const suggestion = screen.getByRole("option", {
        name: /222 Rue Mixte 2, 33000 Bordeaux/i,
      });
      expect(suggestion).toBeInTheDocument();
    });

    const suggestion2 = screen.getByRole("option", {
      name: /222 Rue Mixte 2, 33000 Bordeaux/i,
    });
    await userEvent.click(suggestion2);

    const placesInputs = screen.getAllByLabelText(/Places/i);
    await userEvent.clear(placesInputs[1]);
    await userEvent.type(placesInputs[1], "8");

    const mainTypeBatiSelect = getSelectByName("typeBati");

    const addressRepartitionSelects = screen.getAllByLabelText(/Type de bâti/i);
    const allRepartitionSelects = [
      mainTypeBatiSelect,
      ...addressRepartitionSelects,
    ];
    if (allRepartitionSelects.length > 2) {
      await userEvent.selectOptions(
        allRepartitionSelects[2],
        Repartition.COLLECTIF
      );
    }

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // THEN - Form should submit successfully
    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalled();
    });
  });

  it("should display form without localStorage, can input one adresse (in collectif) and validate", async () => {
    // WHEN
    render(<AdressesRecovery dnaCode={dnaCode} />);

    // THEN - Verify the modal display correctly
    await waitFor(() => {
      expect(screen.getByTestId("adresses-recovery-modal")).toBeInTheDocument();
    });

    const typeBatiSelect = getSelectByName("typeBati");
    await userEvent.selectOptions(typeBatiSelect, Repartition.COLLECTIF);

    const addressInput = screen.getByLabelText(/Adresse/i);
    await userEvent.type(addressInput, "999 Rue Collectif, 31000 Toulouse");

    await waitFor(() => {
      const suggestion = screen.getByRole("option", {
        name: /999 Rue Collectif, 31000 Toulouse/i,
      });
      expect(suggestion).toBeInTheDocument();
    });

    const suggestion = screen.getByRole("option", {
      name: /999 Rue Collectif, 31000 Toulouse/i,
    });
    await userEvent.click(suggestion);

    const placesInput = screen.getByLabelText(/Places/i);
    await userEvent.clear(placesInput);
    await userEvent.type(placesInput, "25");

    const submitButton = screen.getByRole("button", { name: /Valider/i });
    await userEvent.click(submitButton);

    // THEN - Form should submit successfully
    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalled();
    });
  });
});
