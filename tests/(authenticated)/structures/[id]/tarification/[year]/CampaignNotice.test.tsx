import { render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it } from "vitest";

import { CampaignNotice } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/CampaignNotice";

const renderNotice = (
  props: Partial<ComponentProps<typeof CampaignNotice>> = {}
) =>
  render(
    <CampaignNotice
      year={2027}
      phase="OPEN"
      isEligible
      isOperateur={false}
      isOutOfBhasile={false}
      {...props}
    />
  );

describe("CampaignNotice", () => {
  it("n'affiche rien sur une campagne ouverte", () => {
    const { container } = renderNotice();

    expect(container).toBeEmptyDOMElement();
  });

  it("annonce une campagne pas encore ouverte", () => {
    renderNotice({ phase: "UPCOMING" });

    expect(screen.getByText(/n’est pas encore ouverte/)).toBeInTheDocument();
  });

  it("dit aux agents ce qui reste possible en rattrapage", () => {
    renderNotice({ phase: "CATCH_UP" });

    expect(
      screen.getByText(/l’arrêté, la DAM, la DAI et l’échéancier/)
    ).toBeInTheDocument();
  });

  it("dit à l'opérateur qu'une campagne en rattrapage est en lecture seule", () => {
    renderNotice({ phase: "CATCH_UP", isOperateur: true });

    expect(screen.getByText(/en lecture seule/)).toBeInTheDocument();
    expect(screen.queryByText(/déposés et envoyés/)).not.toBeInTheDocument();
  });

  it("explique qu'une structure non éligible n'a pas de tarification, quelle que soit la phase", () => {
    renderNotice({ isEligible: false, phase: "CATCH_UP" });

    expect(screen.getByText(/n’a pas de tarification/)).toBeInTheDocument();
    expect(screen.queryByText(/est close/)).not.toBeInTheDocument();
  });

  it("signale une tarification hors Bhasile, en plus de la phase", () => {
    renderNotice({ isOutOfBhasile: true, phase: "CATCH_UP" });

    expect(screen.getByText(/menée hors de Bhasile/)).toBeInTheDocument();
    expect(screen.getByText(/est close/)).toBeInTheDocument();
  });
});
