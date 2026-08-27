import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PdfExportPayload } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_header/PdfExportDocument";
import { usePdfExport } from "@/app/hooks/usePdfExport";

vi.mock("react-to-print", () => ({
  useReactToPrint: vi.fn(({ onBeforePrint, onAfterPrint }) => {
    return async () => {
      if (onBeforePrint) {
        await onBeforePrint();
      }
      if (onAfterPrint) {
        onAfterPrint();
      }
    };
  }),
}));

vi.mock(
  "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_header/PdfExportDocument",
  () => ({
    PdfExportDocument: ({ data }: { data: PdfExportPayload }) => (
      <div data-testid="pdf-document">TEST {data.exportAddresses}</div>
    ),
  })
);

vi.mock("@/contexts/ExportContext", () => ({
  ExportContext: {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
}));

describe("usePdfExport", () => {
  const mockPayload = {
    structure: {
      nom: "Structure Test",
    },
  } as unknown as PdfExportPayload;

  it("retourne triggerExport et PrintableContainer", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));

    expect(result.current.triggerExport).toBeTypeOf("function");
    expect(result.current.PrintableContainer).toBeTypeOf("function");
  });

  it("affiche le composant masqué par défaut", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));
    const PrintableContainer = result.current.PrintableContainer;

    const { container } = render(<PrintableContainer data={mockPayload} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("hidden");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("bascule le style de masquage lors de l'export PDF", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => usePdfExport("BH-1234"));
    const PrintableContainer = result.current.PrintableContainer;

    const { container, rerender } = render(
      <PrintableContainer data={mockPayload} />
    );

    let exportPromise: Promise<void> | void;

    act(() => {
      exportPromise = result.current.triggerExport();
    });

    rerender(<PrintableContainer data={mockPayload} />);

    const wrapper = container.firstChild as HTMLElement;

    await act(async () => {
      vi.advanceTimersByTime(250);
      await exportPromise;
    });

    rerender(<PrintableContainer data={mockPayload} />);

    expect(wrapper).toHaveClass("hidden");

    vi.useRealTimers();
  });
});
