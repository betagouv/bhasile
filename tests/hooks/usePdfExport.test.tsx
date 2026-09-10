import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrintableContainer } from "@/app/components/PrintableContainer";
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

vi.mock("@/contexts/ExportContext", () => ({
  ExportContext: {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
}));

const renderChildren = () => <div data-testid="pdf-document">TEST CONTENT</div>;

describe("usePdfExport + PrintableContainer", () => {
  it("expose triggerExport, isExporting et printRef", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));

    expect(result.current.triggerExport).toBeTypeOf("function");
    expect(result.current.isExporting).toBeTypeOf("boolean");
    expect(result.current.printRef).toEqual({ current: null });
  });

  it("affiche le composant masqué par défaut avec ses enfants", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));

    const { container } = render(
      <PrintableContainer
        isExporting={result.current.isExporting}
        printRef={result.current.printRef}
      >
        {renderChildren()}
      </PrintableContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("hidden");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("bascule le style de masquage pendant puis après l'export PDF", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => usePdfExport("BH-1234"));

    const { container, rerender } = render(
      <PrintableContainer
        isExporting={result.current.isExporting}
        printRef={result.current.printRef}
      >
        {renderChildren()}
      </PrintableContainer>
    );

    let exportPromise!: ReturnType<typeof result.current.triggerExport>;

    act(() => {
      exportPromise = result.current.triggerExport();
    });
    rerender(
      <PrintableContainer
        isExporting={result.current.isExporting}
        printRef={result.current.printRef}
      >
        {renderChildren()}
      </PrintableContainer>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).not.toHaveClass("hidden");
    expect(wrapper).toHaveClass("opacity-0");
    expect(wrapper).toHaveClass("pointer-events-none");
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(250);
      await exportPromise;
    });

    rerender(
      <PrintableContainer
        isExporting={result.current.isExporting}
        printRef={result.current.printRef}
      >
        {renderChildren()}
      </PrintableContainer>
    );

    expect(wrapper).toHaveClass("hidden");

    vi.useRealTimers();
  });
});
