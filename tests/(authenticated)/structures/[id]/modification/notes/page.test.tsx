import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationNotesPage from "@/app/(authenticated)/structures/[id]/modification/notes/page";
import { StructureType } from "@/types/structure.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("@/app/components/forms/notes/NoteDisclaimer", () => ({
  NoteDisclaimer: () => <div>Note disclaimer</div>,
}));

describe("ModificationNotes page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createStructure({ id: 77, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationNotesPage />);
    await waitFor(() => screen.getByRole("button", { name: "Valider" }));

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{ id: number; notes: string }>(
      mockedFetch
    );
    expect(body.id).toBe(77);
    expect(body.notes).toBeTruthy();
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
