import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContradictoireNotice } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/ContradictoireNotice";
import type { ContradictoireState } from "@/types/tarification.type";

const renderNotice = (overrides: Partial<ContradictoireState>) =>
  render(
    <ContradictoireNotice
      contradictoire={{
        status: "RUNNING",
        l48DocumentId: 1,
        deadline: "2028-04-20",
        isClosed: false,
        ...overrides,
      }}
    />
  );

describe("ContradictoireNotice", () => {
  it("n'affiche rien avant l'envoi de la L48", () => {
    const { container } = renderNotice({
      status: "NOT_STARTED",
      deadline: null,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("donne l'échéance tant que le contradictoire court", () => {
    renderNotice({});

    expect(
      screen.getByText(/réponse attendue au plus tard le 20\/04\/2028/)
    ).toBeInTheDocument();
  });

  it.each([
    ["WAITING_OPENING", /en attente de l’ouverture/],
    ["ACCEPTED", /L48 acceptée/],
    ["CONTESTED", /L48 contestée/],
    ["DEEMED_ACCEPTED", /L48 réputée acceptée/],
  ] as const)("nomme l'état %s, sans échéance", (status, label) => {
    renderNotice({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(/au plus tard/)).not.toBeInTheDocument();
  });
});
