import { fireEvent, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Menu } from "@/app/components/Menu";
import { BHASILE_CONTACT_EMAIL } from "@/constants";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const getGroupButton = (name: string) => screen.getByRole("button", { name });

describe("Menu", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_RESSOURCES", "false");
    vi.stubEnv("NEXT_PUBLIC_SHOW_PARAMETRES", "false");
    mockPathname.mockReturnValue("/");
  });

  it("affiche les éléments pour un utilisateur agent au rendu", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    // WHEN
    render(<Menu />);

    // THEN
    const logo = screen.getByRole("link", {
      name: "Logo Bhasile",
    });
    expect(logo).toHaveAttribute("href", "/");
    const structures = screen.getByRole("link", {
      name: "Voir les structures",
    });
    expect(structures).toHaveAttribute("href", "/structures");
    const cpoms = screen.getByRole("link", { name: "Voir les CPOM" });
    expect(cpoms).toHaveAttribute("href", "/cpoms");
    const operateurs = screen.getByRole("link", {
      name: "Voir les opérateurs",
    });
    expect(operateurs).toHaveAttribute("href", "/operateurs");
    const statistiques = screen.getByRole("link", { name: "Statistiques" });
    expect(statistiques).toHaveAttribute("href", "/statistiques");
    const aide = screen.getByRole("link", {
      name: "Aide",
    });
    expect(aide).toHaveAttribute("href", `mailto:${BHASILE_CONTACT_EMAIL}`);
    expect(aide).toHaveAttribute("target", "_blank");
    expect(aide).toHaveAttribute("rel", "noopener external");
    const confidentialite = screen.getByRole("link", {
      name: "Politique de confidentialité",
    });
    expect(confidentialite).toHaveAttribute(
      "href",
      "/politique-confidentialite"
    );
    const cgu = screen.getByRole("link", {
      name: "Conditions générales d'utilisation",
    });
    expect(cgu).toHaveAttribute("href", "/cgu");
    const mentionsLegales = screen.getByRole("link", {
      name: "Mentions légales",
    });
    expect(mentionsLegales).toHaveAttribute("href", "/mentions-legales");
    const accessibilite = screen.getByRole("link", {
      name: "Accessibilité : non conforme",
    });
    expect(accessibilite).toHaveAttribute("href", "/accessibilite");
    const codeSource = screen.getByRole("link", { name: "Code source" });
    expect(codeSource).toHaveAttribute(
      "href",
      "https://github.com/betagouv/bhasile"
    );
    expect(codeSource).toHaveAttribute("target", "_blank");
    expect(codeSource).toHaveAttribute("rel", "noopener external");
  });

  it("déploie le groupe Structures et opérateurs par défaut quand on est sur /structures", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");

    // WHEN
    render(<Menu />);

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Voir les structures")).toBeInTheDocument();
  });

  it("replie Structures et opérateurs quand on clique dessus", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");

    render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Structures et opérateurs"));

    // THEN
    expect(screen.queryByText("Voir les structures")).not.toBeInTheDocument();
  });

  it("redéploie Structures et opérateurs au second clic", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");

    render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Structures et opérateurs"));
    fireEvent.click(getGroupButton("Structures et opérateurs"));

    // THEN
    expect(screen.getByText("Voir les structures")).toBeInTheDocument();
  });

  it("déploie automatiquement le bon groupe quand on change de page", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");
    const { rerender } = render(<Menu />);

    // WHEN
    mockPathname.mockReturnValue("/cpoms");
    rerender(<Menu />);

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("ouvre ou maintient le groupe si le chemin correspond à un sous-élément en changeant de page", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe", isAgent: true },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");
    const { rerender } = render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Structures et opérateurs"));

    // WHEN
    mockPathname.mockReturnValue("/operateurs");
    rerender(<Menu />);

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("affiche les éléments spécifiques pour un utilisateur opérateur au rendu", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: {
        email: "operateur@example.com",
        name: "Jane Operator",
        operateurId: 10,
        isAgent: false,
      },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    // WHEN
    render(<Menu />);

    // THEN
    const operateurLink = screen.getByRole("link", {
      name: "Voir l’opérateur",
    });
    expect(operateurLink).toHaveAttribute("href", "/operateurs/10");

    expect(screen.queryByText("Tableau de bord")).toBeInTheDocument();
    expect(screen.queryByText("Voir les structures")).toBeInTheDocument();
  });
});
