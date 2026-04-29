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

  it("should return 200 when adresses exist", async () => {
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

  it("should return 404 when no adresses exist", async () => {
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

  it("should return 500 when repository throws", async () => {
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
