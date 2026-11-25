import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addPerimeter,
  getPerimeters,
} from "@/app/api/perimeters/perimeter.service";

const mockFindPerimeters = vi.fn();
const mockFindPerimeterIdByName = vi.fn();
const mockCreatePerimeter = vi.fn();
const mockCreatePerimeterCreationEvent = vi.fn();

vi.mock("@/app/api/perimeters/perimeter.repository", () => ({
  findPerimeters: (...args: unknown[]) => mockFindPerimeters(...args),
  findPerimeterIdByName: (...args: unknown[]) =>
    mockFindPerimeterIdByName(...args),
  createPerimeter: (...args: unknown[]) => mockCreatePerimeter(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createPerimeterCreationEvent: (...args: unknown[]) =>
    mockCreatePerimeterCreationEvent(...args),
}));

const finistere = {
  scope: "DEPARTEMENT" as const,
  departementNumero: "29",
  name: "DDETS Finistère",
};

describe("perimeter.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("décrit la zone de chaque périmètre", async () => {
    mockFindPerimeters.mockResolvedValue([
      {
        id: 1,
        name: "DDETS Finistère",
        grants: [
          {
            scope: "DEPARTEMENT",
            departementNumero: "29",
            regionId: null,
            departement: { name: "Finistère" },
            region: null,
          },
        ],
      },
      {
        id: 2,
        name: "DREETS Bretagne",
        grants: [
          {
            scope: "REGION",
            departementNumero: null,
            regionId: 5,
            departement: null,
            region: { name: "Bretagne" },
          },
        ],
      },
      { id: 3, name: "Lecture nationale", grants: [] },
    ]);

    expect(await getPerimeters()).toEqual([
      {
        id: 1,
        name: "DDETS Finistère",
        zoneKey: "DEPARTEMENT:29",
        zoneLabel: "29 – Finistère",
      },
      {
        id: 2,
        name: "DREETS Bretagne",
        zoneKey: "REGION:5",
        zoneLabel: "Bretagne",
      },
      {
        id: 3,
        name: "Lecture nationale",
        zoneKey: null,
        zoneLabel: "National",
      },
    ]);
  });

  it("refuse un nom de périmètre déjà pris", async () => {
    mockFindPerimeterIdByName.mockResolvedValue({ id: 1 });

    await expect(addPerimeter(finistere, "POST")).rejects.toMatchObject({
      status: 409,
    });
    expect(mockCreatePerimeter).not.toHaveBeenCalled();
  });

  it("crée un périmètre sur une zone déjà couverte, sous un autre nom, le trace et renvoie son id", async () => {
    mockFindPerimeterIdByName.mockResolvedValue(null);
    mockCreatePerimeter.mockResolvedValue({ id: 7 });

    await expect(
      addPerimeter({ ...finistere, name: "DDETS Finistère – SIAO" }, "POST")
    ).resolves.toEqual({ id: 7 });

    expect(mockCreatePerimeter).toHaveBeenCalledWith({
      ...finistere,
      name: "DDETS Finistère – SIAO",
    });
    expect(mockCreatePerimeterCreationEvent).toHaveBeenCalledWith("POST", {
      perimeterId: "7",
      name: "DDETS Finistère – SIAO",
    });
  });
});
