import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentDeposit } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentDeposit";
import { ApiError } from "@/app/utils/api-error.util";
import type { DepositOption } from "@/lib/tarification/tarification.actions";

const mockOnDeposit = vi.fn();

const AGENT_OPTIONS: DepositOption[] = [
  { type: "ARRETE", label: "Arrêté 2028", statuses: ["FINAL", "DRAFT"] },
  { type: "DAM", label: "DAM 2028", statuses: ["FINAL", "DRAFT"] },
];
const OPERATEUR_OPTIONS: DepositOption[] = [
  { type: "CA", label: "CA 2026", statuses: ["SHARED"] },
];

const file = new File(["contenu"], "depot.pdf", { type: "application/pdf" });

const uploadFile = () =>
  userEvent.upload(screen.getByLabelText("Fichier à déposer"), file);

describe("DocumentDeposit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDeposit.mockResolvedValue(undefined);
  });

  it("dépose une version de travail par défaut", async () => {
    render(
      <DocumentDeposit options={AGENT_OPTIONS} onDeposit={mockOnDeposit} />
    );

    await uploadFile();

    await waitFor(() =>
      expect(mockOnDeposit).toHaveBeenCalledWith({
        file,
        type: "ARRETE",
        status: "DRAFT",
      })
    );
  });

  it("dépose une version signée quand la case est cochée, du type choisi", async () => {
    render(
      <DocumentDeposit options={AGENT_OPTIONS} onDeposit={mockOnDeposit} />
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Type de document"),
      "DAM"
    );
    await userEvent.click(screen.getByLabelText("C’est la version signée"));
    await uploadFile();

    await waitFor(() =>
      expect(mockOnDeposit).toHaveBeenCalledWith({
        file,
        type: "DAM",
        status: "FINAL",
      })
    );
  });

  it("ne demande ni type ni signature quand il n'y a pas de choix", async () => {
    render(
      <DocumentDeposit options={OPERATEUR_OPTIONS} onDeposit={mockOnDeposit} />
    );

    expect(screen.queryByLabelText("Type de document")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("C’est la version signée")
    ).not.toBeInTheDocument();

    await uploadFile();

    await waitFor(() =>
      expect(mockOnDeposit).toHaveBeenCalledWith({
        file,
        type: "CA",
        status: "SHARED",
      })
    );
  });

  it("affiche le refus du serveur", async () => {
    mockOnDeposit.mockRejectedValue(
      new ApiError("Ce dépôt n'est pas ouvert sur cette campagne", 409)
    );
    render(
      <DocumentDeposit options={OPERATEUR_OPTIONS} onDeposit={mockOnDeposit} />
    );

    await uploadFile();

    expect(await screen.findByRole("alert")).toHaveTextContent("pas ouvert");
  });
});
