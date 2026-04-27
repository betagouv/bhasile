import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationNotesPage from "@/app/(authenticated)/structures/[id]/finalisation/06-notes/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/app/components/forms/notes/NoteDisclaimer", () => ({
  NoteDisclaimer: () => <div>Note disclaimer</div>,
}));

describe("FinalisationNotes page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    const structure = createFinalisationValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationNotesPage />);
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

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
    expectFinalisationStepValidation(body, {
      structureId: 77,
      stepLabel: "06-notes",
      mockRouterPush,
    });
    // 06-notes is the last step — no navigation, scroll to top instead
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("should autosave notes after debounce and send updated data in PUT payload", async () => {
    // GIVEN
    const structure = createFinalisationValidStructure(78);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationNotesPage />);
    await waitFor(() => screen.getByRole("textbox"));
    // Switch to fake timers after rendering to control the debounce
    vi.useFakeTimers();

    // WHEN
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Note de suivi" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{ id: number; notes: string }>(
      mockedFetch
    );
    expect(body.id).toBe(78);
    expect(body.notes).toBe("Note de suivi");
  });
});
