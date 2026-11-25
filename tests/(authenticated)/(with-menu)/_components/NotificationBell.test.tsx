import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "@/app/(authenticated)/(with-menu)/_components/NotificationBell";
import type { NotificationApiRead } from "@/schemas/api/notification.schema";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

const mockFetch = vi.fn();

const buildItem = (
  overrides: Partial<NotificationApiRead> & Pick<NotificationApiRead, "key">
): NotificationApiRead => ({
  eventId: 1,
  occurredAt: "2028-04-10T08:00:00.000Z",
  dateLabel: "10/04/2028 10:00",
  label: "Dépôt : Compte administratif 2026",
  structureCode: "CADA-35-001",
  departement: "35",
  authorLevelLabel: "Opérateur",
  href: "/structures/42/tarification/2028?etape=CA",
  isNew: true,
  ...overrides,
});

const ITEMS = [
  buildItem({
    key: "event-2",
    eventId: 2,
    occurredAt: "2028-04-11T08:00:00.000Z",
  }),
  buildItem({
    key: "event-1",
    eventId: 1,
    label: "Envoi : L48 2028",
    isNew: false,
  }),
];

const answer = (
  notificationResponse: Promise<Response> = Promise.resolve(
    new Response(JSON.stringify(ITEMS), { status: 200 })
  ),
  count = 0
) =>
  mockFetch.mockImplementation((url: string) => {
    if (url === "/api/notifications") {
      return notificationResponse;
    }
    if (url === "/api/notifications/count") {
      return Promise.resolve(
        new Response(JSON.stringify({ count }), { status: 200 })
      );
    }
    return Promise.resolve(new Response(null, { status: 204 }));
  });

const getCalls = (url: string) =>
  mockFetch.mock.calls.filter(([calledUrl]) => calledUrl === url);

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("accorde le libellé au singulier pour une seule nouveauté", async () => {
    answer(undefined, 1);
    render(<NotificationBell />);

    expect(
      await screen.findByRole("button", { name: "Notifications, 1 nouvelle" })
    ).toBeInTheDocument();
  });

  it("plafonne la pastille à 99+", async () => {
    answer(undefined, 100);
    render(<NotificationBell />);

    expect(await screen.findByText("99+")).toBeInTheDocument();
  });

  it("affiche 99 nouveautés sans plafond", async () => {
    answer(undefined, 99);
    render(<NotificationBell />);

    expect(await screen.findByText("99")).toBeInTheDocument();
  });

  it("relit la pastille toutes les 60 secondes, sauf quand l'onglet est caché", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answer();
    render(<NotificationBell />);
    await waitFor(() =>
      expect(getCalls("/api/notifications/count")).toHaveLength(1)
    );

    await vi.advanceTimersByTimeAsync(60_000);
    expect(getCalls("/api/notifications/count")).toHaveLength(2);

    const visibilityState = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    await vi.advanceTimersByTimeAsync(120_000);
    expect(getCalls("/api/notifications/count")).toHaveLength(2);

    visibilityState.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() =>
      expect(getCalls("/api/notifications/count")).toHaveLength(3)
    );
  });

  it("charge la liste à l'ouverture et avance le repère jusqu'à la ligne la plus récente", async () => {
    answer();
    render(<NotificationBell />);

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByText("Envoi : L48 2028")).toBeInTheDocument();
    const newMarker = screen.getByText("Nouveau :");
    expect(newMarker.parentElement).toHaveTextContent(
      "Dépôt : Compte administratif 2026"
    );
    await waitFor(() =>
      expect(getCalls("/api/notifications/seen")).toHaveLength(1)
    );
    expect(JSON.parse(getCalls("/api/notifications/seen")[0][1].body)).toEqual({
      seenUntil: "2028-04-11T08:00:00.000Z",
    });
  });

  it("remet la pastille à zéro une fois le repère avancé", async () => {
    let count = 3;
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/notifications") {
        return Promise.resolve(
          new Response(JSON.stringify(ITEMS), { status: 200 })
        );
      }
      if (url === "/api/notifications/count") {
        return Promise.resolve(
          new Response(JSON.stringify({ count }), { status: 200 })
        );
      }
      count = 0;
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    render(<NotificationBell />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Notifications, 3 nouvelles" })
    );

    expect(
      await screen.findByRole("button", { name: "Notifications" })
    ).toBeInTheDocument();
  });

  it("n'avance pas le repère si la liste ne se charge pas", async () => {
    answer(Promise.resolve(new Response(null, { status: 500 })));
    render(<NotificationBell />);

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(getCalls("/api/notifications/seen")).toHaveLength(0);
  });

  it("n'avance pas le repère si le panneau est refermé avant l'arrivée de la liste", async () => {
    let resolveList: (response: Response) => void = () => undefined;
    answer(new Promise((resolve) => (resolveList = resolve)));
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    await userEvent.click(button);

    await userEvent.click(button);
    resolveList(new Response(JSON.stringify(ITEMS), { status: 200 }));

    await waitFor(() => expect(getCalls("/api/notifications")).toHaveLength(1));
    expect(getCalls("/api/notifications/seen")).toHaveLength(0);
  });

  it("referme le panneau quand la page défile, puisque l'en-tête se cache", async () => {
    answer();
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    await userEvent.click(button);

    fireEvent.scroll(window);

    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("retire la ligne cliquée et enregistre la lecture du fait", async () => {
    answer();
    render(<NotificationBell />);
    await userEvent.click(screen.getByRole("button"));

    await userEvent.click(await screen.findByText("Envoi : L48 2028"));

    expect(screen.queryByText("Envoi : L48 2028")).not.toBeInTheDocument();
    const [[, init]] = getCalls("/api/notifications/reads");
    expect(JSON.parse(init.body)).toEqual({ eventId: 1 });
    expect(init.keepalive).toBe(true);
  });

  it("ferme le panneau avec Échap et rend le focus au bouton", async () => {
    answer();
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    await userEvent.click(button);
    await screen.findByText("Envoi : L48 2028");

    await userEvent.keyboard("{Escape}");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
