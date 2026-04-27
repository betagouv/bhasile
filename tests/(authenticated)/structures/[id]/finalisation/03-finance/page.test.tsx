import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationFinancePage from "@/app/(authenticated)/structures/[id]/finalisation/03-finance/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationFinanceValidStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
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
    await waitFor(() =>
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      forms: Array<{
        formSteps: Array<{
          stepDefinition: { label: string };
          status: StepStatus;
        }>;
      }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.forms[0].formSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepDefinition: expect.objectContaining({ label: "03-finance" }),
          status: StepStatus.VALIDE,
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("04-controles");
  });

  it("should block submit when financial indicators are missing", async () => {
    // GIVEN
    const structure = {
      ...createFinalisationFinanceValidStructure(78),
      indicateursFinanciers: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationFinancePage />);
    await waitFor(() =>
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
