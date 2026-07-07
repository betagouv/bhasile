import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { ListColumn } from "@/types/ListColumn";

import { getOrderButton } from "./OrderButton.test";

const mockPush = vi.fn();
const mockReplace = vi.fn();

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

const COLUMNS: ListColumn[] = [
  {
    label: "Code Bhasile",
    column: "codeBhasile",
    orderBy: true,
  },
  {
    label: "Type",
    column: "type",
    orderBy: true,
  },
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
  },
  {
    label: "Dépt.",
    column: "departementAdministratif",
    orderBy: true,
  },
  {
    label: "Bâti",
    column: "bati",
    orderBy: true,
  },
  {
    label: "Communes",
    column: "communes",
    orderBy: false,
  },
  {
    label: "Places aut.",
    column: "placesAutorisees",
    orderBy: true,
  },
  {
    label: "Fin convention",
    column: "finConvention",
    orderBy: true,
  },
];

describe("ListTableHeadings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialise la colonne et la direction de tri depuis les paramètres d'URL", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=codeBhasile&direction=asc")
    );

    render(
      <ListTableHeadings ariaLabelledBy="test" columns={COLUMNS}>
        {[
          <tr key="test">
            <td>Test</td>
          </tr>,
        ]}
      </ListTableHeadings>
    );

    const codeBhasileButton = getOrderButton("codeBhasile");
    expect(codeBhasileButton).toBeInTheDocument();
  });

  it("met à jour l'URL au clic sur le tri", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(
      <ListTableHeadings ariaLabelledBy="test" columns={COLUMNS}>
        {[
          <tr key="test">
            <td>Test</td>
          </tr>,
        ]}
      </ListTableHeadings>
    );

    const typeButton = getOrderButton("type");
    await user.click(typeButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("column=type&direction=asc")
      );
    });
  });

  it("bascule la direction d'ascendant à descendant en recliquant la même colonne", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=codeBhasile&direction=asc")
    );

    render(
      <ListTableHeadings ariaLabelledBy="test" columns={COLUMNS}>
        {[
          <tr key="test">
            <td>Test</td>
          </tr>,
        ]}
      </ListTableHeadings>
    );

    const codeBhasileButton = getOrderButton("codeBhasile");
    await user.click(codeBhasileButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("column=codeBhasile&direction=desc")
      );
    });
  });

  it("supprime le tri en recliquant la même colonne en direction descendante", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=codeBhasile&direction=desc")
    );

    // Clear any initial calls from render
    vi.clearAllMocks();

    render(
      <ListTableHeadings ariaLabelledBy="test" columns={COLUMNS}>
        {[
          <tr key="test">
            <td>Test</td>
          </tr>,
        ]}
      </ListTableHeadings>
    );

    // Wait for initial render effects
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });

    // Clear calls from initial render
    mockReplace.mockClear();

    const codeBhasileButton = getOrderButton("codeBhasile");
    await user.click(codeBhasileButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
      const callArgs =
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
      expect(callArgs).not.toContain("column=codeBhasile");
      expect(callArgs).not.toContain("direction=");
    });
  });

  it("trie la nouvelle colonne en ascendant au clic sur une colonne différente", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=codeBhasile&direction=asc")
    );

    render(
      <ListTableHeadings ariaLabelledBy="test" columns={COLUMNS}>
        {[
          <tr key="test">
            <td>Test</td>
          </tr>,
        ]}
      </ListTableHeadings>
    );

    const typeButton = getOrderButton("type");
    await user.click(typeButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("column=type&direction=asc")
      );
    });
  });
});
