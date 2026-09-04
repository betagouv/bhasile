import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("usePdfExport", () => {
  const renderChildren = () => (
    <div data-testid="pdf-document">TEST CONTENT</div>
  );

  it("retourne triggerExport et PrintableContainer", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));

    expect(result.current.triggerExport).toBeTypeOf("function");
    expect(result.current.PrintableContainer).toBeTypeOf("function");
  });

  it("affiche le composant masqué par défaut avec ses enfants", () => {
    const { result } = renderHook(() => usePdfExport("BH-1234"));
    const PrintableContainer = result.current.PrintableContainer;

    const { container } = render(
      <PrintableContainer>{renderChildren()}</PrintableContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("hidden");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("bascule le style de masquage pendant puis après l'export PDF", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => usePdfExport("BH-1234"));
    const PrintableContainer = result.current.PrintableContainer;

    const { container, rerender } = render(
      <PrintableContainer>{renderChildren()}</PrintableContainer>
    );

    let exportPromise: Promise<void> | void;

    act(() => {
      exportPromise = result.current.triggerExport();
    });

    rerender(<PrintableContainer>{renderChildren()}</PrintableContainer>);

    const wrapper = container.firstChild as HTMLElement;

    await act(async () => {
      vi.advanceTimersByTime(250);
      await exportPromise;
    });

    rerender(<PrintableContainer>{renderChildren()}</PrintableContainer>);

    expect(wrapper).toHaveClass("hidden");

    vi.useRealTimers();
  });
});
