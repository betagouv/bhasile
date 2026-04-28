import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StructureClientProvider } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import FinalisationIdentificationPage from "@/app/(authenticated)/structures/[id]/finalisation/01-identification/page";
import { FetchStateProvider } from "@/app/context/FetchStateContext";
import { CURRENT_YEAR } from "@/constants";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createStructure } from "../../../../../test-utils/structure.factory";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock(
  "@/app/(authenticated)/structures/[id]/finalisation/_components/Tabs",
  () => ({
    Tabs: () => <div>Tabs</div>,
  })
);

vi.mock("@/app/components/SubmitError", () => ({
  SubmitError: () => <div>Submit error</div>,
}));

vi.mock("@/app/components/ui/InformationBar", () => ({
  InformationBar: () => <div>Information bar</div>,
}));

describe("FinalisationIdentification page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    const structure = createStructure({ id: 77, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    render(
      <FetchStateProvider>
        <StructureClientProvider structure={structure}>
          <FinalisationIdentificationPage />
        </StructureClientProvider>
      </FetchStateProvider>
    );
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith("/api/dna-codes?structureId=77");
    });

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // THEN
    const putCalls = mockedFetch.mock.calls.filter(
      (call) =>
        call[0] === "/api/structures" &&
        (call[1] as RequestInit | undefined)?.method === "PUT"
    );
    const putCall = putCalls.find((call) => {
      const body = (call[1] as RequestInit | undefined)?.body;
      if (typeof body !== "string") {
        return false;
      }
      try {
        const parsed = JSON.parse(body);
        return Array.isArray(parsed.forms);
      } catch {
        return false;
      }
    });
    expect(putCall).toBeDefined();

    const firstCallBody = JSON.parse(
      (putCall?.[1] as RequestInit).body as string
    );

    expect(firstCallBody.id).toBe(77);
    expect(firstCallBody.forms[0].formSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepDefinition: expect.objectContaining({
            label: "01-identification",
          }),
          status: StepStatus.VALIDE,
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("02-documents-financiers");
  });

  it("should autosave form data and send full expected payload", async () => {
    // GIVEN
    const structure = createStructure({ id: 78, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    render(
      <FetchStateProvider>
        <StructureClientProvider structure={structure}>
          <FinalisationIdentificationPage />
        </StructureClientProvider>
      </FetchStateProvider>
    );
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith("/api/dna-codes?structureId=78");
    });
    vi.useFakeTimers();

    // WHEN
    const newContact = {
      prenom: "Jean",
      nom: "Dupont",
      telephone: "0612345678",
      email: "jean.dupont@example.com",
      role: "Directeur",
      perimetre: "",
    };
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un contact" }));
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: newContact.prenom },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: newContact.nom },
    });
    fireEvent.change(screen.getByLabelText("Fonction"), {
      target: { value: newContact.role },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: newContact.email },
    });
    fireEvent.change(screen.getByLabelText("Téléphone"), {
      target: { value: newContact.telephone },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    // THEN
    const putCall = mockedFetch.mock.calls.find(
      (call) =>
        call[0] === "/api/structures" &&
        (call[1] as RequestInit | undefined)?.method === "PUT"
    );
    expect(putCall).toBeDefined();

    const actualPayload = JSON.parse(
      (putCall?.[1] as RequestInit).body as string
    );

    const expectedPayload = {
      id: 78,
      codeBhasile: "BHA-78",
      type: "CADA",
      operateur: {
        id: 1,
        name: "Adoma",
      },
      creationDate: "2007-01-01T12:00:00.000Z",
      public: "Tout public",
      lgbt: true,
      fvvTeh: false,
      contacts: [newContact],
      dnaStructures: [
        {
          id: 1,
          dna: {
            code: "C0001",
            description: "",
          },
          startDate: null,
          endDate: null,
        },
      ],
      finesses: [
        {
          id: 1,
          code: "123456789",
          description: "",
        },
      ],
      debutPeriodeAutorisation: "2022-01-01T12:00:00.000Z",
      finPeriodeAutorisation: "2025-01-01T12:00:00.000Z",
      debutConvention: "2024-01-01T12:00:00.000Z",
      finConvention: "2027-01-01T12:00:00.000Z",
      nom: "Les Mimosas",
      adresseAdministrativeComplete:
        "1, avenue de la République 75011 Paris 75",
      adresseAdministrative: "1, avenue de la République",
      codePostalAdministratif: "75011",
      communeAdministrative: "Paris",
      departementAdministratif: "75",
      antennes: [],
      structureTypologies: [
        {
          id: 1,
          placesAutorisees: 10,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
          year: CURRENT_YEAR,
          placesACreer: 0,
          placesAFermer: 0,
        },
        {
          id: 2,
          placesAutorisees: 10,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
          year: CURRENT_YEAR - 1,
          placesACreer: 0,
          placesAFermer: 0,
        },
        {
          id: 3,
          placesAutorisees: 10,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
          year: CURRENT_YEAR - 2,
          placesACreer: 0,
          placesAFermer: 0,
        },
        {
          id: 4,
          placesAutorisees: 10,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
          year: CURRENT_YEAR - 3,
          placesACreer: 0,
          placesAFermer: 0,
        },
      ],
    };

    expect(actualPayload).toEqual(expectedPayload);
  });
});
