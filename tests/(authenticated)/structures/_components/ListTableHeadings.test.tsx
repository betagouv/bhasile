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

  it("should initialize column and direction from URL params", () => {
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

  it("should update URL when ordering is clicked", async () => {
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

  it("should toggle direction from asc to desc when clicking same column", async () => {
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

  it("should clear ordering when clicking same column in desc direction", async () => {
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

  it("should set new column to asc when clicking different column", async () => {
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
