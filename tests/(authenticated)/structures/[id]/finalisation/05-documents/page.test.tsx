import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsPage from "@/app/(authenticated)/(with-menu)/structures/[id]/finalisation/05-documents/page";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureType } from "@/types/structure.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  FinalisationStepValidationPayload,
  findPutStructuresCall,
  flushAutoSaveDebounce,
  getLatestPutStructuresPayloadMatching,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/",
}));

describe("FinalisationDocuments page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("valide l'étape des documents et envoie l'étape de finalisation à jour dans le payload PUT", async () => {
    // GIVEN
    // Provide valid actesAdministratifs so the autorisee schema passes validation
    const base = createFinalisationValidStructure(77);
    const structure = {
      ...base,
      actesAdministratifs: [
        {
          id: 1,
          category: "ARRETE_AUTORISATION" as const,
          startDate: "2022-01-01T12:00:00.000Z",
          endDate: "2025-01-01T12:00:00.000Z",
          fileUploads: [{ id: 1, key: "arrete-autorisation" }],
        },
        {
          id: 2,
          category: "ARRETE_TARIFICATION" as const,
          startDate: "2022-01-01T12:00:00.000Z",
          endDate: "2025-01-01T12:00:00.000Z",
          fileUploads: [{ id: 2, key: "arrete-tarification" }],
        },
      ],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body =
      getLatestPutStructuresPayloadMatching<FinalisationStepValidationPayload>(
        mockedFetch,
        (payload) =>
          payload.forms?.[0]?.formSteps?.some(
            (step) => step.stepDefinition.label === "05-documents"
          ) ?? false
      );
    expectFinalisationStepValidation(body, {
      structureId: 77,
      stepLabel: "05-documents",
      nextRoute: "06-notes",
      mockRouterPush,
    });
  });

  it("valide l'étape sans acte propre quand le CPOM porte déjà les arrêtés du type de la structure", async () => {
    // GIVEN
    const base = createFinalisationValidStructure(78);
    const structure = {
      ...base,
      actesAdministratifs: [],
      cpomStructures: [
        {
          cpom: {
            actesAdministratifs: [
              {
                id: 10,
                category: "ARRETE_AUTORISATION" as const,
                structureType: base.type,
                parentId: null,
                fileUploads: [{ id: 10, key: "arrete-autorisation-cpom" }],
              },
              {
                id: 11,
                category: "ARRETE_TARIFICATION" as const,
                structureType: base.type,
                parentId: null,
                fileUploads: [{ id: 11, key: "arrete-tarification-cpom" }],
              },
            ],
          },
        },
      ] as unknown as StructureApiRead["cpomStructures"],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);

    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
  });

  it("refuse de valider l'étape documents sans convention pour une structure subventionnée", async () => {
    // GIVEN
    const base = createFinalisationValidStructure(80);
    const structure = {
      ...base,
      type: StructureType.HUDA,
      isAutorisee: false,
      isSubventionnee: true,
      actesAdministratifs: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("valide l'étape sans convention propre quand le CPOM porte celle du type de la structure", async () => {
    // GIVEN
    const base = createFinalisationValidStructure(81);
    const structure = {
      ...base,
      type: StructureType.HUDA,
      isAutorisee: false,
      isSubventionnee: true,
      actesAdministratifs: [],
      cpomStructures: [
        {
          cpom: {
            actesAdministratifs: [
              {
                id: 12,
                category: "CONVENTION" as const,
                structureType: StructureType.HUDA,
                parentId: null,
                fileUploads: [{ id: 12, key: "convention-cpom" }],
              },
            ],
          },
        },
      ] as unknown as StructureApiRead["cpomStructures"],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
  });

  it("sauvegarde automatiquement les données des documents après le debounce", async () => {
    // GIVEN
    const base = createFinalisationValidStructure(79);
    const structure = {
      ...base,
      actesAdministratifs: [
        {
          id: 1,
          category: "ARRETE_AUTORISATION" as const,
          startDate: "2022-01-01T12:00:00.000Z",
          endDate: "2025-01-01T12:00:00.000Z",
          fileUploads: [{ id: 1, key: "arrete-autorisation" }],
        },
      ],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    vi.useFakeTimers();
    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);

    // WHEN
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.change(input, { target: { value: "2023-01-01" } });
    await flushAutoSaveDebounce();

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
    const payload = getPutStructuresPayload<{
      id: number;
      actesAdministratifs?: Array<{ id: number; category: string }>;
    }>(mockedFetch);
    expect(payload.id).toBe(79);
    expect(payload.actesAdministratifs?.length).toBeGreaterThan(0);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
