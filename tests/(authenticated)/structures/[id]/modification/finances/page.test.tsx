import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";
import ModificationFinancesPage from "@/app/(authenticated)/structures/[id]/modification/finances/page";
import { CURRENT_YEAR } from "@/constants";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createModificationFinancesValidStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";

vi.mock("@/app/utils/date.util", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/app/utils/date.util")>();
  return {
    ...original,
    getYearRange: () => ({
      years: [
        CURRENT_YEAR,
        CURRENT_YEAR - 1,
        CURRENT_YEAR - 2,
        CURRENT_YEAR - 3,
      ],
    }),
  };
});

describe("ModificationFinances page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createModificationFinancesValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationFinancesPage />);
    await waitFor(() => screen.getByRole("button", { name: "Valider" }));

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      budgets: Array<{ year: number }>;
      indicateursFinanciers: Array<{ year: number }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.budgets.length).toBeGreaterThan(0);
    expect(body.indicateursFinanciers.length).toBeGreaterThan(0);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });

  it("should block submit when indicators are missing", async () => {
    // GIVEN
    const structure = {
      ...createModificationFinancesValidStructure(78),
      indicateursFinanciers: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationFinancesPage />);
    await waitFor(() => screen.getByRole("button", { name: "Valider" }));

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
