import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/operateurs/[id]/route";

const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCreateOperateurEvent = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createOperateurEvent: (...args: unknown[]) =>
    mockCreateOperateurEvent(...args),
}));

describe("GET /api/operateurs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return operateur when found", async () => {
    // GIVEN
    const operateur = { id: 1, name: "Adoma", structures: [] };
    mockFindOne.mockResolvedValueOnce(operateur);

    const request = new NextRequest("http://localhost/api/operateurs/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...operateur, vulnerabilites: [] });
    expect(mockFindOne).toHaveBeenCalledWith(1);
    expect(mockCreateOperateurEvent).toHaveBeenCalledWith("GET", 1);
  });

  it("should return 500 when operateur is not found", async () => {
    // GIVEN
    mockFindOne.mockRejectedValueOnce(new Error("Not found"));

    const request = new NextRequest("http://localhost/api/operateurs/99");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "99" }),
    });

    // THEN
    expect(response.status).toBe(500);
    expect(mockCreateOperateurEvent).not.toHaveBeenCalled();
  });

  it("should return 500 when service throws", async () => {
    // GIVEN
    mockFindOne.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/operateurs/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(500);
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });
});

describe("PUT /api/operateurs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with operateurId on success", async () => {
    // GIVEN
    mockUpdateOne.mockResolvedValueOnce({ id: 1 });

    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Adoma Modifié" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ operateurId: 1 });
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(mockCreateOperateurEvent).toHaveBeenCalledWith("PUT", 1);
  });

  it("should return 400 when url id is not a valid number", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/operateurs/abc", {
      method: "PUT",
      body: JSON.stringify({ name: "Adoma" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "abc" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockCreateOperateurEvent).not.toHaveBeenCalled();
  });

  it("should accept actesAdministratifs in body and forward them to updateOne", async () => {
    // GIVEN
    mockUpdateOne.mockResolvedValueOnce({ id: 1 });

    const acte = {
      category: "STATUTS",
      date: "2024-03-15",
      fileUploads: [{ key: "abc123" }],
    };
    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify({
        name: "Adoma",
        actesAdministratifs: [acte],
      }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        actesAdministratifs: expect.arrayContaining([
          expect.objectContaining({
            category: "STATUTS",
            fileUploads: [expect.objectContaining({ key: "abc123" })],
          }),
        ]),
      })
    );
  });

  it("should return 400 when an acte has an invalid category", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify({
        name: "Adoma",
        actesAdministratifs: [{ category: "INVALID_CATEGORY" }],
      }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
