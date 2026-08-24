import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VisualizationTabs } from "@/app/(authenticated)/(with-menu)/structures/_components/VisualizationTabs";

const mockReplace = vi.fn();
const mockTrackStructuresCartographie = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("statut=fermees"),
}));
vi.mock("@/app/hooks/useUserAction", () => ({
  useUserAction: () => ({
    trackStructuresCartographie: mockTrackStructuresCartographie,
  }),
}));
vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("VisualizationTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("coche l'onglet correspondant au paramètre vue", () => {
    render(<VisualizationTabs vue="carte" />);

    expect(screen.getByLabelText("Carte")).toBeChecked();
  });

  it("pose vue dans l'URL en conservant les autres filtres", async () => {
    render(<VisualizationTabs vue="tableau" />);

    await userEvent.click(screen.getByLabelText("Carte"));

    expect(mockReplace).toHaveBeenCalledWith(
      "?statut=fermees&vue=carte",
      expect.anything()
    );
  });

  it("trace le passage à la cartographie", async () => {
    render(<VisualizationTabs vue="tableau" />);

    await userEvent.click(screen.getByLabelText("Carte"));

    expect(mockTrackStructuresCartographie).toHaveBeenCalledTimes(1);
  });
});
