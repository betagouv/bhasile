import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotificationsCarousel } from "@/app/(authenticated)/(with-menu)/_components/NotificationsCarousel";
import { DashboardNotification } from "@/types/dashboard.type";

const notifications: DashboardNotification[] = [
  { id: 1, content: "<p>Alpha</p>" },
  { id: 2, content: "<p>Bravo</p>" },
  { id: 3, content: "<p>Charlie</p>" },
];

const renderCarousel = (
  items: DashboardNotification[] = notifications
): ReturnType<typeof render> =>
  render(<NotificationsCarousel notifications={items} />);

const getRegion = (): HTMLElement =>
  screen.getByRole("region", { name: "Notifications" });

const activeSlideText = (): string =>
  screen.getByRole("group").querySelector('[aria-hidden="false"]')
    ?.textContent ?? "";

describe("NotificationsCarousel", () => {
  it("affiche la première notification et le compteur", () => {
    renderCarousel();

    expect(activeSlideText()).toBe("Alpha");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("passe à la notification suivante au clic sur le bouton suivant", () => {
    renderCarousel();

    fireEvent.click(
      screen.getByRole("button", { name: "Notification suivante" })
    );

    expect(activeSlideText()).toBe("Bravo");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("navigue avec la flèche droite du clavier", () => {
    renderCarousel();

    fireEvent.keyDown(getRegion(), { key: "ArrowRight" });

    expect(activeSlideText()).toBe("Bravo");
  });

  it("boucle vers la première notification après la dernière", () => {
    renderCarousel();
    const region = getRegion();

    fireEvent.keyDown(region, { key: "ArrowRight" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    fireEvent.keyDown(region, { key: "ArrowRight" });

    expect(activeSlideText()).toBe("Alpha");
  });

  it("boucle vers la dernière notification avec la flèche gauche depuis la première", () => {
    renderCarousel();

    fireEvent.keyDown(getRegion(), { key: "ArrowLeft" });

    expect(activeSlideText()).toBe("Charlie");
  });

  it("masque les contrôles quand il n'y a qu'une seule notification", () => {
    renderCarousel([{ id: 1, content: "<p>Seule</p>" }]);

    expect(
      screen.queryByRole("button", { name: "Notification suivante" })
    ).not.toBeInTheDocument();
    expect(activeSlideText()).toBe("Seule");
  });

  it("fait glisser la slide entrante depuis la droite et la sortante vers la gauche au suivant", () => {
    const { container } = renderCarousel();

    fireEvent.click(
      screen.getByRole("button", { name: "Notification suivante" })
    );

    expect(
      container.querySelector(".animate-slide-in-right")
    ).toBeInTheDocument();
    expect(
      container.querySelector(".animate-slide-out-left")
    ).toBeInTheDocument();
  });

  it("inverse le sens de glissement au précédent", () => {
    const { container } = renderCarousel();

    fireEvent.click(
      screen.getByRole("button", { name: "Notification précédente" })
    );

    expect(
      container.querySelector(".animate-slide-in-left")
    ).toBeInTheDocument();
    expect(
      container.querySelector(".animate-slide-out-right")
    ).toBeInTheDocument();
  });
});
