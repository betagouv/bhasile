import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationPlaces from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/01-places/page";
import { StructureType } from "@/types/structure.type";

import { createActualisationForm } from "../../../../../../test-utils/factories/actualisation-form.factory";
import { createStructure } from "../../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  renderWithStructurePageProviders,
} from "../../../../../../test-utils/structure-page-test.helpers";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/",
  useParams: () => ({ year: "2026" }),
}));
vi.mock("@/app/components/forms/AutoSave", () => ({ AutoSave: () => null }));

const actualisationStructure = () => ({
  ...createStructure({ id: 1, type: StructureType.CADA }),
  structureTypologies: [
    { year: 2023, placesAutorisees: 90, pmr: 4, lgbt: 1, fvvTeh: 2 },
    { year: 2024, placesAutorisees: 95, pmr: 4, lgbt: 2, fvvTeh: 2 },
    { year: 2025, placesAutorisees: 100, pmr: 5, lgbt: 2, fvvTeh: 3 },
    { year: 2026, placesAutorisees: 100, pmr: 5, lgbt: 2, fvvTeh: 3 },
  ],
  forms: [createActualisationForm(2026)],
});

const findActualisationPut = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.find(
    (call) =>
      call[0] === "/api/structures/1/actualisation" &&
      (call[1] as RequestInit | undefined)?.method === "PUT"
  );

const stepStatusInPayload = (put: unknown[] | undefined, slug: string) => {
  const payload = JSON.parse((put?.[1] as RequestInit).body as string);
  return payload.forms[0].formSteps.find(
    (formStep: { stepDefinition: { slug: string } }) =>
      formStep.stepDefinition.slug === slug
  )?.status;
};

describe("Page actualisation 01-places", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("affiche le tableau des places de toutes les années", () => {
    renderWithStructurePageProviders(
      actualisationStructure(),
      <ActualisationPlaces />
    );

    expect(screen.getByText("Détails et historique")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Valider" })
    ).toBeInTheDocument();
  });

  it("valide l'étape via la sous-route actualisation puis navigue à l'étape suivante", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => actualisationStructure(),
    });

    renderWithStructurePageProviders(
      actualisationStructure(),
      <ActualisationPlaces />
    );

    await clickButtonByName("Valider");

    const put = findActualisationPut(fetchMock);
    expect(put).toBeDefined();
    expect(stepStatusInPayload(put, "01-places")).toBe("VALIDE");
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/1/actualisation/2026/02-documents-financiers"
    );
  });

  it("valide même quand la capacité projetée ≥ seuil est vide (cellule verrouillée)", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const structureSansCapacite2026 = {
      ...actualisationStructure(),
      structureTypologies: [
        { year: 2023, placesAutorisees: 90, pmr: 4, lgbt: 1, fvvTeh: 2 },
        { year: 2024, placesAutorisees: 95, pmr: 4, lgbt: 2, fvvTeh: 2 },
        { year: 2025, placesAutorisees: 100, pmr: 5, lgbt: 2, fvvTeh: 3 },
        { year: 2026, placesAutorisees: null, pmr: 5, lgbt: 2, fvvTeh: 3 },
      ],
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => structureSansCapacite2026,
    });

    renderWithStructurePageProviders(
      structureSansCapacite2026,
      <ActualisationPlaces />
    );

    await clickButtonByName("Valider");

    // La cellule ≥ seuil verrouillée et vide ne bloque pas la validation.
    expect(findActualisationPut(fetchMock)).toBeDefined();
  });
});
