import { beforeEach, describe, expect, it, vi } from "vitest";

import { addAgent, updateAgentAccess } from "@/app/api/agents/agent.service";

const mockFindUserIdByEmail = vi.fn();
const mockFindAgentById = vi.fn();
const mockCreateActivatedAgent = vi.fn();
const mockActivateAgent = vi.fn();
const mockDeactivateAgent = vi.fn();
const mockGetPerimeterOrThrow = vi.fn();
const mockCreateAgentAccessEvent = vi.fn();

vi.mock("@/app/api/agents/agent.repository", () => ({
  findUserIdByEmail: (...args: unknown[]) => mockFindUserIdByEmail(...args),
  findAgentById: (...args: unknown[]) => mockFindAgentById(...args),
  createActivatedAgent: (...args: unknown[]) =>
    mockCreateActivatedAgent(...args),
  activateAgent: (...args: unknown[]) => mockActivateAgent(...args),
  deactivateAgent: (...args: unknown[]) => mockDeactivateAgent(...args),
}));

vi.mock("@/app/api/perimeters/perimeter.service", () => ({
  getPerimeterOrThrow: (...args: unknown[]) => mockGetPerimeterOrThrow(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createAgentAccessEvent: (...args: unknown[]) =>
    mockCreateAgentAccessEvent(...args),
}));

const finistere = { id: 3, name: "DDETS Finistère" };
const pendingAgent = {
  id: 12,
  isActivated: false,
  deactivatedAt: null,
  perimeter: null,
};

describe("agent.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPerimeterOrThrow.mockResolvedValue(finistere);
    mockFindAgentById.mockResolvedValue(pendingAgent);
  });

  it("refuse d'ajouter un email qui a déjà un compte", async () => {
    mockFindUserIdByEmail.mockResolvedValue({ id: 4 });

    await expect(
      addAgent({ email: "agent@gouv.fr", perimeterId: 3 }, "POST")
    ).rejects.toMatchObject({ status: 409 });
    expect(mockCreateActivatedAgent).not.toHaveBeenCalled();
  });

  it("crée un agent absent de la base, activé dans son périmètre, et trace l'action", async () => {
    mockFindUserIdByEmail.mockResolvedValue(null);
    mockCreateActivatedAgent.mockResolvedValue({ id: 20 });

    await addAgent({ email: "agent@gouv.fr", perimeterId: 3 }, "POST");

    expect(mockCreateActivatedAgent).toHaveBeenCalledWith("agent@gouv.fr", 3);
    expect(mockCreateAgentAccessEvent).toHaveBeenCalledWith("POST", {
      targetUserId: "20",
      from: "Absent de Bhasile",
      to: "Actif · DDETS Finistère",
    });
  });

  it("renvoie une 404 pour un compte qui n'est pas un agent gérable", async () => {
    mockFindAgentById.mockResolvedValue(null);

    await expect(
      updateAgentAccess(12, { status: "DEACTIVATED" }, "PUT")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("valide un agent en attente dans un périmètre et trace l'avant-après", async () => {
    await updateAgentAccess(12, { status: "ACTIVATED", perimeterId: 3 }, "PUT");

    expect(mockActivateAgent).toHaveBeenCalledWith(12, 3);
    expect(mockCreateAgentAccessEvent).toHaveBeenCalledWith("PUT", {
      targetUserId: "12",
      from: "En attente",
      to: "Actif · DDETS Finistère",
    });
  });

  it("désactive un agent en conservant son périmètre", async () => {
    mockFindAgentById.mockResolvedValue({
      ...pendingAgent,
      isActivated: true,
      perimeter: finistere,
    });

    await updateAgentAccess(12, { status: "DEACTIVATED" }, "PUT");

    expect(mockDeactivateAgent).toHaveBeenCalledWith(12, expect.any(Date));
    expect(mockCreateAgentAccessEvent).toHaveBeenCalledWith("PUT", {
      targetUserId: "12",
      from: "Actif · DDETS Finistère",
      to: "Désactivé · DDETS Finistère",
    });
  });
});
