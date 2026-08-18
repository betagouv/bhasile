import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/cpoms/route";

const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

describe("POST /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 201 avec le cpomId en cas de succès", async () => {
    const payload = { id: 1, operateur: { name: "Opérateur Test" } };
    mockCreateOrUpdateCpom.mockResolvedValueOnce(1);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ cpomId: 1 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("POST", 1);
  });

  it("retourne 400 quand le nom de l'opérateur est manquant", async () => {
    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ id: 1, operateur: { name: "" } }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
