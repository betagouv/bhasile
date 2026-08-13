import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListNavigation } from "@/app/hooks/useListNavigation";
import { LIST_NAVIGATION_KEY } from "@/constants";
import { FetchState } from "@/types/fetch-state.type";

const mockSetFetchState = vi.fn();

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

describe("useListNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne publie rien tant qu'aucune navigation n'est lancée", () => {
    // WHEN
    render(<Navigator onNavigate={never} />);

    // THEN
    expect(mockSetFetchState).not.toHaveBeenCalled();
  });

  it("signale la navigation puis la libère quand elle aboutit", async () => {
    // GIVEN
    const user = userEvent.setup();
    let resolveNavigation: (() => void) | undefined;
    render(
      <Navigator
        onNavigate={() =>
          new Promise<void>((resolve) => {
            resolveNavigation = resolve;
          })
        }
      />
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // THEN
    expect(mockSetFetchState).toHaveBeenLastCalledWith(
      LIST_NAVIGATION_KEY,
      FetchState.LOADING
    );

    // WHEN
    await act(async () => {
      resolveNavigation?.();
    });

    // THEN
    expect(mockSetFetchState).toHaveBeenLastCalledWith(
      LIST_NAVIGATION_KEY,
      FetchState.IDLE
    );
  });

  it("libère la navigation quand le composant est démonté en cours de route", async () => {
    // GIVEN — une navigation qui ne se résoudra jamais
    const user = userEvent.setup();
    render(<UnmountableNavigator />);
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // WHEN
    await user.click(screen.getByRole("button", { name: "démonter" }));

    // THEN
    expect(mockSetFetchState).toHaveBeenLastCalledWith(
      LIST_NAVIGATION_KEY,
      FetchState.IDLE
    );
  });
});

const Navigator = ({
  onNavigate,
}: {
  onNavigate: () => Promise<void>;
}): ReactElement => {
  const startNavigation = useListNavigation();
  return (
    <button onClick={() => startNavigation(async () => onNavigate())}>
      naviguer
    </button>
  );
};

const UnmountableNavigator = (): ReactElement => {
  const [isMounted, setIsMounted] = useState(true);
  return (
    <>
      {isMounted && <Navigator onNavigate={never} />}
      <button onClick={() => setIsMounted(false)}>démonter</button>
    </>
  );
};

const never = (): Promise<void> => new Promise<void>(() => {});
