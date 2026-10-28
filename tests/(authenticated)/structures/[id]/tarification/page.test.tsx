import { beforeEach, describe, expect, it, vi } from "vitest";

import CurrentTarificationPage from "@/app/(authenticated)/structures/[id]/tarification/page";

const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2027,
  };
});

describe("CurrentTarificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige vers la campagne de l'année en cours", async () => {
    await expect(
      CurrentTarificationPage({ params: Promise.resolve({ id: "42" }) })
    ).rejects.toThrow("NEXT_REDIRECT /structures/42/tarification/2027");
  });

  it("renvoie introuvable pour un identifiant invalide", async () => {
    await expect(
      CurrentTarificationPage({ params: Promise.resolve({ id: "abc" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
