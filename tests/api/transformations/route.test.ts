import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/transformations/route";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockCreateOne = vi.fn();
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockFindAll = vi.fn();

vi.mock("@/app/api/transformations/transformation.repository", () => ({
  createOne: (...args: unknown[]) => mockCreateOne(...args),
  findOne: (...args: unknown[]) => mockFindOne(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
  findAll: (...args: unknown[]) => mockFindAll(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

const mockGetServerSession = vi.mocked(getServerSession);

describe("POST /api/transformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 and transformation id when body is valid", async () => {
    mockCreateOne.mockResolvedValueOnce(99);
    const body = {
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          structureVersion: { structureId: 1 },
        },
      ],
    };
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ transformationId: 99 });
    expect(mockCreateOne).toHaveBeenCalledWith(body);
    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 400 when body does not match schema", async () => {
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureTransformations: [],
      }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockCreateOne).not.toHaveBeenCalled();
  });
});

describe("GET /api/transformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ongoing transformations the agent can access", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        id: "1",
        name: "Agent",
        email: "agent@example.com",
        role: "DEPARTEMENT",
        allowedDepartements: ["50"],
      },
    } as never);
    mockFindAll.mockResolvedValueOnce([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(mockFindAll).not.toHaveBeenCalled();
  });
});
