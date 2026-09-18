import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HudaTransformationForm } from "@/app/components/forms/transformation-types/HudaTransformationForm";
import { TransformationType } from "@/types/transformation.type";

describe("HudaTransformationForm", () => {
  it("n'affiche les destinations qu'une fois le mode de départ choisi", async () => {
    const user = userEvent.setup();
    render(
      <HudaTransformationForm
        transformationType={undefined}
        setTransformationType={vi.fn()}
      />
    );

    expect(
      screen.queryByText(/Leurs places sont remises en concurrence/)
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Un ou plusieurs HUDA ferment"));

    expect(
      screen.getByText(/Leurs places sont remises en concurrence/)
    ).toBeInTheDocument();
  });

  it("renvoie le type de la branche fermeture", async () => {
    const user = userEvent.setup();
    const setTransformationType = vi.fn();
    render(
      <HudaTransformationForm
        transformationType={undefined}
        setTransformationType={setTransformationType}
      />
    );

    await user.click(screen.getByText("Un ou plusieurs HUDA ferment"));
    await user.click(
      screen.getByText(
        /Leurs places sont transférées à un ou plusieurs CADA existants/
      )
    );

    expect(setTransformationType).toHaveBeenLastCalledWith(
      TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT
    );
  });

  it("renvoie le type de la branche contraction pour la même destination", async () => {
    const user = userEvent.setup();
    const setTransformationType = vi.fn();
    render(
      <HudaTransformationForm
        transformationType={undefined}
        setTransformationType={setTransformationType}
      />
    );

    await user.click(
      screen.getByText(/Un ou plusieurs HUDA font l’objet d’une contraction/)
    );
    await user.click(
      screen.getByText(
        /Leurs places sont transférées à un ou plusieurs CADA existants/
      )
    );

    expect(setTransformationType).toHaveBeenLastCalledWith(
      TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT
    );
  });

  it("oublie la destination quand le mode de départ change", async () => {
    const user = userEvent.setup();
    const setTransformationType = vi.fn();
    render(
      <HudaTransformationForm
        transformationType={undefined}
        setTransformationType={setTransformationType}
      />
    );

    await user.click(screen.getByText("Un ou plusieurs HUDA ferment"));
    await user.click(screen.getByText("Modifier"));

    expect(setTransformationType).toHaveBeenLastCalledWith(undefined);
  });
});
