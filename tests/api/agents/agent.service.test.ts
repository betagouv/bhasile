import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAgent,
  getAgents,
  updateAgentAccess,
} from "@/app/api/agents/agent.service";

const mockFindAgents = vi.fn();
const mockFindUserIdByEmail = vi.fn();
const mockFindAgentById = vi.fn();
const mockCreateActivatedAgent = vi.fn();
const mockActivateAgent = vi.fn();
const mockDeactivateAgent = vi.fn();
const mockGetPerimeterOrThrow = vi.fn();
const mockCreateAgentAccessEvent = vi.fn();
const mockGetContactEmails = vi.fn();

vi.mock("@/app/api/agents/agent.repository", () => ({
  findAgents: (...args: unknown[]) => mockFindAgents(...args),
  findAgentById: (...args: unknown[]) => mockFindAgentById(...args),
  createActivatedAgent: (...args: unknown[]) =>
    mockCreateActivatedAgent(...args),
  activateAgent: (...args: unknown[]) => mockActivateAgent(...args),
  deactivateAgent: (...args: unknown[]) => mockDeactivateAgent(...args),
}));

vi.mock("@/app/api/users/user.repository", () => ({
  findUserIdByEmail: (...args: unknown[]) => mockFindUserIdByEmail(...args),
}));

vi.mock("@/app/api/perimeters/perimeter.service", () => ({
  getPerimeterOrThrow: (...args: unknown[]) => mockGetPerimeterOrThrow(...args),
}));

vi.mock("@/app/api/contacts/contact.service", () => ({
  getContactEmails: (...args: unknown[]) => mockGetContactEmails(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createAgentAccessEvent: (...args: unknown[]) =>
    mockCreateAgentAccessEvent(...args),
}));

const finistere = { id: 3, name: "DDETS Finistère" };
const pendingAgent = {
  id: 12,
  email: "agent@finistere.gouv.fr",
  isActivated: false,
  deactivatedAt: null,
  perimeter: null,
};
const activeAgent = {
  ...pendingAgent,
  isActivated: true,
  perimeter: finistere,
};

describe("agent.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPerimeterOrThrow.mockResolvedValue(finistere);
    mockFindAgentById.mockResolvedValue(pendingAgent);
    mockGetContactEmails.mockResolvedValue(new Set());
  });

  it("retire des comptes en attente les contacts de structure, sans toucher aux comptes déjà gérés", async () => {
    const activeContact = {
      ...activeAgent,
      id: 13,
      email: "contact-actif@operateur.fr",
    };
    mockFindAgents.mockResolvedValue([
      pendingAgent,
      { ...pendingAgent, id: 14, email: "contact@operateur.fr" },
      activeContact,
    ]);
    mockGetContactEmails.mockResolvedValue(
      new Set(["contact@operateur.fr", "contact-actif@operateur.fr"])
    );

    const agents = await getAgents();

    expect(mockGetContactEmails).toHaveBeenCalledWith([
      "agent@finistere.gouv.fr",
      "contact@operateur.fr",
    ]);
    expect(agents.map(({ id }) => id)).toEqual([12, 13]);
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

  it.each([
    [
      "un compte qui n'est pas un agent gérable",
      () => mockFindAgentById.mockResolvedValue(null),
    ],
    [
      "un contact de structure en attente",
      () =>
        mockGetContactEmails.mockResolvedValue(new Set([pendingAgent.email])),
    ],
  ])("renvoie une 404 pour %s", async (_, arrange) => {
    arrange();

    await expect(
      updateAgentAccess(12, { status: "ACTIVATED", perimeterId: 3 }, "PUT")
    ).rejects.toMatchObject({ status: 404 });
    expect(mockActivateAgent).not.toHaveBeenCalled();
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
    mockFindAgentById.mockResolvedValue(activeAgent);

    await updateAgentAccess(12, { status: "DEACTIVATED" }, "PUT");

    expect(mockDeactivateAgent).toHaveBeenCalledWith(12, expect.any(Date));
    expect(mockCreateAgentAccessEvent).toHaveBeenCalledWith("PUT", {
      targetUserId: "12",
      from: "Actif · DDETS Finistère",
      to: "Désactivé · DDETS Finistère",
    });
  });
});
