import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/cpoms/[id]/route";

const mockFindOne = vi.fn();
const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

describe("PUT /api/cpoms/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 200 avec le cpomId en cas de succès", async () => {
    // GIVEN
    mockCreateOrUpdateCpom.mockResolvedValueOnce(2);

    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "Opérateur Test" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cpomId: 2 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("PUT", 2);
    expect(mockCreateOrUpdateCpom).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
  });

  it("retourne 400 quand le corps de la requête est invalide", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
