import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StructuresPage from "@/app/(authenticated)/structures/(structure)/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@socialgouv/matomo-next", () => ({
  sendEvent: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="structures-map" />,
}));

vi.mock("@/app/hooks/usePersistStructuresSearchQuery", () => ({
  usePersistStructuresSearchQuery: vi.fn(),
}));

vi.mock("@/app/hooks/useStructuresSearch", () => ({
  useStructuresSearch: () => ({ structures: [], totalStructures: 0 }),
}));

vi.mock("@/app/components/lists/ListLoader", () => ({
  ListLoader: ({ children }: { children: ReactNode }) => (
    <div data-testid="list-loader">{children}</div>
  ),
}));

describe("Structures page (hash)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
  });

  it("should select 'Carte' when url hash is #carte", async () => {
    // GIVEN
    window.location.hash = "#carte";

    // WHEN
    render(<StructuresPage />);

    // THEN
    await waitFor(() => {
      expect(screen.getByLabelText("Carte")).toBeChecked();
    });
  });
});
