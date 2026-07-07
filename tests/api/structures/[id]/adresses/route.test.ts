import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HEAD } from "@/app/api/structures/[id]/adresses/route";

const mockCheckAdressesExistence = vi.fn();

vi.mock("@/app/api/adresses/adresse.repository", () => ({
  checkAdressesExistence: (...args: unknown[]) =>
    mockCheckAdressesExistence(...args),
}));

describe("HEAD /api/structures/[id]/adresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 200 quand des adresses existent", async () => {
    // GIVEN
    mockCheckAdressesExistence.mockResolvedValueOnce(true);

    const request = new NextRequest(
      "http://localhost/api/structures/1/adresses",
      { method: "HEAD" }
    );

    // WHEN
    const response = await HEAD(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(mockCheckAdressesExistence).toHaveBeenCalledWith(1);
  });

  it("retourne 404 quand aucune adresse n'existe", async () => {
    // GIVEN
    mockCheckAdressesExistence.mockResolvedValueOnce(false);

    const request = new NextRequest(
      "http://localhost/api/structures/1/adresses",
      { method: "HEAD" }
    );

    // WHEN
    const response = await HEAD(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(404);
  });

  it("retourne 500 quand le repository lève une erreur", async () => {
    // GIVEN
    mockCheckAdressesExistence.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest(
      "http://localhost/api/structures/1/adresses",
      { method: "HEAD" }
    );

    // WHEN
    const response = await HEAD(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(500);
  });
});
