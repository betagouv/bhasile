import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationFinancePage from "@/app/(authenticated)/(with-menu)/structures/[id]/finalisation/03-finance/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationFinanceValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  FinalisationStepValidationPayload,
  findPutStructuresCall,
  flushAutoSaveDebounce,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

describe("FinalisationFinance page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    const structure = createFinalisationFinanceValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationFinancePage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body =
      getPutStructuresPayload<FinalisationStepValidationPayload>(mockedFetch);
    expectFinalisationStepValidation(body, {
      structureId: 77,
      stepLabel: "03-finance",
      nextRoute: "04-controles",
      mockRouterPush,
    });
  });

  it("should block submit when financial indicators are missing", async () => {
    // GIVEN
    const structure = {
      ...createFinalisationFinanceValidStructure(78),
      indicateursFinanciers: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationFinancePage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("should autosave finance data after debounce", async () => {
    // GIVEN
    const structure = createFinalisationFinanceValidStructure(79);
    const mockedFetch = mockStructurePageFetch(structure);

    vi.useFakeTimers();
    renderWithStructurePageProviders(structure, <FinalisationFinancePage />);

    // WHEN
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.change(input, { target: { value: "12" } });
    await flushAutoSaveDebounce();

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
    const payload = getPutStructuresPayload<{
      id: number;
      budgets?: Array<{ year: number }>;
      indicateursFinanciers?: Array<{ year: number }>;
    }>(mockedFetch);
    expect(payload.id).toBe(79);
    expect(payload.budgets ?? payload.indicateursFinanciers).toBeTruthy();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
