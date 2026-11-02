import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentActionBar } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentActionBar";
import { ApiError } from "@/app/utils/api-error.util";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

const mockModalOpen = vi.fn();
const mockModalClose = vi.fn();
const mockRecordEvent = vi.fn();
const mockRespondToL48 = vi.fn();

vi.mock("@codegouvfr/react-dsfr/Modal", () => ({
  createModal: () => ({
    open: mockModalOpen,
    close: mockModalClose,
    Component: ({
      title,
      children,
      buttons,
    }: {
      title: string;
      children: ReactNode;
      buttons: {
        children: ReactNode;
        disabled?: boolean;
        onClick?: () => void;
      }[];
    }) => (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        {buttons.map((button, index) => (
          <button
            key={index}
            type="button"
            disabled={button.disabled}
            onClick={button.onClick}
          >
            {button.children}
          </button>
        ))}
      </div>
    ),
  }),
}));

const NONE = {
  canApprove: false,
  canRequestChanges: false,
  canShare: false,
  canWithdraw: false,
};

const version = {
  id: 7,
  types: ["RCA"],
} as unknown as SectionVersion;

const renderBar = (
  props: Partial<ComponentProps<typeof DocumentActionBar>> = {}
) =>
  render(
    <DocumentActionBar
      sectionCode="RCA"
      version={version}
      versionActions={NONE}
      canMarkNotApplicable={false}
      canRespondToL48={false}
      reviewerNames={[]}
      hasSharedL48={false}
      contradictoireDeadline={null}
      recordEvent={mockRecordEvent}
      respondToL48={mockRespondToL48}
      {...props}
    />
  );

const getModal = () => within(screen.getByTestId("modal"));

describe("DocumentActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordEvent.mockResolvedValue(undefined);
    mockRespondToL48.mockResolvedValue(undefined);
  });

  it("n'affiche aucune barre sans action ni relecteur, mais garde la modale montée", () => {
    const { container } = renderBar();

    expect(container.querySelector("footer")).toBeNull();
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("propose seulement de demander des modifications à qui a déjà relu", () => {
    renderBar({ versionActions: { ...NONE, canRequestChanges: true } });

    expect(
      screen.getByRole("button", { name: "Demander des modifications" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "J’ai relu ce document" })
    ).not.toBeInTheDocument();
  });

  it("enregistre « J'ai relu » sans confirmation", async () => {
    renderBar({
      versionActions: { ...NONE, canApprove: true, canRequestChanges: true },
    });

    await userEvent.click(
      screen.getByRole("button", { name: "J’ai relu ce document" })
    );

    expect(mockRecordEvent).toHaveBeenCalledWith({
      type: "APPROVED",
      documentId: 7,
    });
    expect(mockModalOpen).not.toHaveBeenCalled();
  });

  it("affiche le refus du serveur sur « J'ai relu »", async () => {
    mockRecordEvent.mockRejectedValue(
      new ApiError("L'auteur d'une version ne la relit pas", 403)
    );
    renderBar({
      versionActions: { ...NONE, canApprove: true, canRequestChanges: true },
    });

    await userEvent.click(
      screen.getByRole("button", { name: "J’ai relu ce document" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ne la relit pas"
    );
  });

  it("exige un motif pour demander des modifications", async () => {
    renderBar({
      versionActions: { ...NONE, canApprove: true, canRequestChanges: true },
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Demander des modifications" })
    );

    const confirm = getModal().getByRole("button", {
      name: "Demander des modifications",
    });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      getModal().getByLabelText("Modifications demandées"),
      "  Corriger le montant "
    );
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(mockRecordEvent).toHaveBeenCalledWith({
        type: "CHANGES_REQUESTED",
        documentId: 7,
        text: "Corriger le montant",
      })
    );
    expect(mockModalClose).toHaveBeenCalled();
  });

  describe("envoi à l'opérateur", () => {
    const openShare = async (
      props: Partial<ComponentProps<typeof DocumentActionBar>> = {}
    ) => {
      renderBar({ versionActions: { ...NONE, canShare: true }, ...props });
      await userEvent.click(
        screen.getByRole("button", { name: "Envoyer à l’opérateur" })
      );
    };

    it("n'envoie qu'après confirmation", async () => {
      await openShare();

      expect(mockRecordEvent).not.toHaveBeenCalled();

      await userEvent.click(
        getModal().getByRole("button", { name: "Envoyer à l’opérateur" })
      );

      await waitFor(() =>
        expect(mockRecordEvent).toHaveBeenCalledWith({
          type: "DOCUMENT_SHARED",
          documentId: 7,
        })
      );
    });

    it("garde la modale ouverte et affiche le refus du serveur", async () => {
      mockRecordEvent.mockRejectedValue(
        new ApiError("Pas de L48 sans BP déposé", 409)
      );
      await openShare();

      await userEvent.click(
        getModal().getByRole("button", { name: "Envoyer à l’opérateur" })
      );

      expect(await getModal().findByRole("alert")).toHaveTextContent(
        "Pas de L48 sans BP"
      );
      expect(mockModalClose).not.toHaveBeenCalled();
    });

    it("signale un document non relu", async () => {
      await openShare();

      expect(screen.getByText("non relu")).toBeInTheDocument();
      expect(getModal().getByText(/relu par personne/)).toBeInTheDocument();
    });

    it("annonce le délai du contradictoire pour une L48", async () => {
      await openShare({
        version: { ...version, types: ["L48"] },
        reviewerNames: ["Marie"],
      });

      expect(getModal().getByText(/délai de 8 jours/)).toBeInTheDocument();
      expect(
        getModal().queryByText(/relu par personne/)
      ).not.toBeInTheDocument();
    });

    it("avertit qu'une deuxième L48 ne relance pas le délai", async () => {
      await openShare({
        version: { ...version, types: ["L48"] },
        hasSharedL48: true,
      });

      expect(getModal().getByText(/ne relance pas/)).toBeInTheDocument();
    });
  });

  it("exige un motif pour retirer un document", async () => {
    renderBar({ versionActions: { ...NONE, canWithdraw: true } });

    await userEvent.click(screen.getByRole("button", { name: "Retirer" }));
    const confirm = getModal().getByRole("button", {
      name: "Retirer le document",
    });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      getModal().getByLabelText("Motif du retrait"),
      "Erreur de structure"
    );
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(mockRecordEvent).toHaveBeenCalledWith({
        type: "DOCUMENT_WITHDRAWN",
        documentId: 7,
        text: "Erreur de structure",
      })
    );
  });

  it("ne garde pas le motif d'une action annulée pour la suivante", async () => {
    renderBar({
      versionActions: { ...NONE, canWithdraw: true },
      canMarkNotApplicable: true,
    });

    await userEvent.click(screen.getByRole("button", { name: "Retirer" }));
    await userEvent.type(
      getModal().getByLabelText("Motif du retrait"),
      "Motif abandonné"
    );
    await userEvent.click(getModal().getByRole("button", { name: "Annuler" }));
    await userEvent.click(screen.getByRole("button", { name: "Sans objet" }));

    expect(getModal().getByLabelText("Motif")).toHaveValue("");
    expect(
      getModal().getByRole("button", { name: "Déclarer sans objet" })
    ).toBeDisabled();
  });

  it("déclare une étape sans objet avec un motif, en rappelant que ça ne s'annule pas", async () => {
    renderBar({ canMarkNotApplicable: true, sectionCode: "L48" });

    await userEvent.click(screen.getByRole("button", { name: "Sans objet" }));

    expect(getModal().getByText(/ne s’annule pas/)).toBeInTheDocument();

    await userEvent.type(getModal().getByLabelText("Motif"), "CA jamais reçu");
    await userEvent.click(
      getModal().getByRole("button", { name: "Déclarer sans objet" })
    );

    await waitFor(() =>
      expect(mockRecordEvent).toHaveBeenCalledWith({
        type: "STEP_MARKED_NOT_APPLICABLE",
        stepCode: "L48",
        text: "CA jamais reçu",
      })
    );
  });

  describe("réponse à la L48", () => {
    it("transmet la contestation, ses observations et sa pièce, avec l'échéance annoncée", async () => {
      renderBar({
        canRespondToL48: true,
        contradictoireDeadline: "2028-04-20",
      });

      await userEvent.click(
        screen.getByRole("button", { name: "Je conteste" })
      );

      expect(getModal().getByText(/jusqu’au 20\/04\/2028/)).toBeInTheDocument();

      const file = new File(["contenu"], "reponse.pdf", {
        type: "application/pdf",
      });
      await userEvent.type(
        getModal().getByLabelText("Observations (facultatif)"),
        "Montant erroné"
      );
      await userEvent.upload(
        getModal().getByLabelText("Joindre une réponse (facultatif)"),
        file
      );
      await userEvent.click(
        getModal().getByRole("button", { name: "Je conteste la L48" })
      );

      await waitFor(() =>
        expect(mockRespondToL48).toHaveBeenCalledWith({
          type: "L48_CONTESTED",
          text: "Montant erroné",
          file,
        })
      );
    });

    it("accepte sans observation ni pièce", async () => {
      renderBar({ canRespondToL48: true });

      await userEvent.click(screen.getByRole("button", { name: "J’accepte" }));
      await userEvent.click(
        getModal().getByRole("button", { name: "J’accepte la L48" })
      );

      await waitFor(() =>
        expect(mockRespondToL48).toHaveBeenCalledWith({
          type: "L48_ACCEPTED",
          text: "",
          file: null,
        })
      );
    });
  });
});
