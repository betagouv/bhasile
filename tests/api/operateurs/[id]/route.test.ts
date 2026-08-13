import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/operateurs/[id]/route";

const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCreateOperateurEvent = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findAllStructures: vi.fn(),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createOperateurEvent: (...args: unknown[]) =>
    mockCreateOperateurEvent(...args),
}));

describe("PUT /api/operateurs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renvoie 200 avec operateurId en cas de succès", async () => {
    // GIVEN
    const body = {
      name: "Adoma Modifié",
      logo: {
        key: "uuid-file-key",
      },
      contacts: [
        {
          prenom: "John",
          nom: "Doe",
          perimetre: "Sud Ouest",
          role: "Directeur",
          email: "john.doe@example.com",
          telephone: "0123456789",
        },
      ],
    };
    mockUpdateOne.mockResolvedValueOnce({
      id: 1,
      ...body,
    });

    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      operateurId: 1,
    });
    expect(mockUpdateOne).toHaveBeenCalledWith({ id: 1, ...body });
    expect(mockCreateOperateurEvent).toHaveBeenCalledWith("PUT", 1);
  });

  it("renvoie 400 quand l'id d'url n'est pas un nombre valide", async () => {
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

  it("accepte les actesAdministratifs dans le body et les transmet à updateOne", async () => {
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

  it("renvoie 400 quand un acte a une catégorie invalide", async () => {
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
