import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTransformationNavigateWithSave } from "@/app/hooks/useTransformationNavigateWithSave";
import { FetchState } from "@/types/fetch-state.type";

const mockRouterPush = vi.fn();
const mockSaveCurrentForm = vi.fn();
const mockGetFetchState = vi.fn<() => FetchState>();
const mockUseOptionalTransformationContext = vi.fn<
  () => { saveCurrentForm: () => Promise<boolean>; isSaverRegistered: boolean }
>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/",
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useOptionalTransformationContext: () =>
      mockUseOptionalTransformationContext(),
  })
);

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({ getFetchState: () => mockGetFetchState() }),
}));

const TARGET_ROUTE = "/structures/transformation/12/creation/7/places";

describe("useTransformationNavigateWithSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFetchState.mockReturnValue(FetchState.IDLE);
    mockUseOptionalTransformationContext.mockReturnValue({
      saveCurrentForm: mockSaveCurrentForm,
      isSaverRegistered: true,
    });
  });

  it("navigue sans sauver quand aucun formulaire n'est monté", async () => {
    mockUseOptionalTransformationContext.mockReturnValue({
      saveCurrentForm: mockSaveCurrentForm,
      isSaverRegistered: false,
    });

    const { result } = renderHook(() => useTransformationNavigateWithSave());
    await result.current.navigateWithSave(TARGET_ROUTE);

    expect(mockSaveCurrentForm).not.toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith(TARGET_ROUTE);
  });

  it("ne fait rien quand une sauvegarde est déjà en cours", async () => {
    mockGetFetchState.mockReturnValue(FetchState.LOADING);

    const { result } = renderHook(() => useTransformationNavigateWithSave());
    await result.current.navigateWithSave(TARGET_ROUTE);

    expect(mockSaveCurrentForm).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("sauvegarde puis navigue quand la sauvegarde réussit", async () => {
    mockSaveCurrentForm.mockResolvedValue(true);

    const { result } = renderHook(() => useTransformationNavigateWithSave());
    await result.current.navigateWithSave(TARGET_ROUTE);

    expect(mockSaveCurrentForm).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith(TARGET_ROUTE);
  });

  it("bloque la navigation quand la sauvegarde est invalide", async () => {
    mockSaveCurrentForm.mockResolvedValue(false);

    const { result } = renderHook(() => useTransformationNavigateWithSave());
    await result.current.navigateWithSave(TARGET_ROUTE);

    expect(mockSaveCurrentForm).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("bloque la navigation quand la sauvegarde échoue côté réseau", async () => {
    mockSaveCurrentForm.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useTransformationNavigateWithSave());
    await result.current.navigateWithSave(TARGET_ROUTE);

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
