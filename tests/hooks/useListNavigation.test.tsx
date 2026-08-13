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

  it("publie l'attente au démarrage de la navigation, pas au montage", async () => {
    // GIVEN
    const user = userEvent.setup();
    const navigation = createPendingNavigation();
    render(<Navigator onNavigate={navigation.start} />);
    expect(mockSetFetchState).not.toHaveBeenCalled();

    // WHEN
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // THEN
    expect(mockSetFetchState.mock.calls).toEqual([
      [LIST_NAVIGATION_KEY, FetchState.LOADING],
    ]);

    // WHEN
    await act(async () => {
      navigation.resolve();
    });

    // THEN
    expect(mockSetFetchState.mock.calls).toEqual([
      [LIST_NAVIGATION_KEY, FetchState.LOADING],
      [LIST_NAVIGATION_KEY, FetchState.IDLE],
    ]);
  });

  it("libère l'attente quand le composant est démonté en pleine navigation", async () => {
    // GIVEN
    const user = userEvent.setup();
    const navigation = createPendingNavigation();
    render(<UnmountableNavigator onNavigate={navigation.start} />);
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // WHEN
    await user.click(screen.getByRole("button", { name: "démonter" }));

    // THEN
    expect(mockSetFetchState).toHaveBeenLastCalledWith(
      LIST_NAVIGATION_KEY,
      FetchState.IDLE
    );

    await act(async () => {
      navigation.resolve();
    });
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

const UnmountableNavigator = ({
  onNavigate,
}: {
  onNavigate: () => Promise<void>;
}): ReactElement => {
  const [isMounted, setIsMounted] = useState(true);
  return (
    <>
      {isMounted && <Navigator onNavigate={onNavigate} />}
      <button onClick={() => setIsMounted(false)}>démonter</button>
    </>
  );
};

const createPendingNavigation = () => {
  let resolveNavigation: () => void = () => {};
  return {
    start: (): Promise<void> =>
      new Promise<void>((resolve) => {
        resolveNavigation = resolve;
      }),
    resolve: (): void => resolveNavigation(),
  };
};
