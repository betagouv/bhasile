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
      user: { email: "test@example.com", name: "John Doe" },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    // WHEN
    render(<Menu />);
    fireEvent.click(getGroupButton("Structures d’hébergement"));

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
      name: "Opérateurs",
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

  it("déploie le groupe Structures d'hébergement par défaut quand on est sur /structures", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
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
    expect(getGroupButton("Structures d’hébergement")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Voir les structures")).toBeInTheDocument();
  });

  it("replie Structures d'hébergement quand on clique dessus", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");

    render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Structures d’hébergement"));

    // THEN
    expect(screen.queryByText("Voir les structures")).not.toBeInTheDocument();
  });

  it("redéploie Structures d'hébergement au second clic", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");

    render(<Menu />);

    // WHEN - premier clic
    fireEvent.click(getGroupButton("Structures d’hébergement"));

    // WHEN - second clic
    fireEvent.click(getGroupButton("Structures d’hébergement"));

    // THEN
    expect(screen.getByText("Voir les structures")).toBeInTheDocument();
  });

  it("déploie automatiquement le bon groupe quand on change de page", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
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
    expect(getGroupButton("Structures d’hébergement")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("garde le groupe replié en changeant de page vers un autre endroit", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
    };

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    mockPathname.mockReturnValue("/structures");
    const { rerender } = render(<Menu />);

    // WHEN - on ouvre le groupe
    fireEvent.click(getGroupButton("Structures d’hébergement"));

    // WHEN - on change de page
    mockPathname.mockReturnValue("/operateurs");
    rerender(<Menu />);

    // THEN - le groupe devrait se refermer car pas actif sur /operateurs
    expect(getGroupButton("Structures d’hébergement")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    // Note: le groupe reste ouvert si la nouvelle page est dans ses subItems
    // Ici /operateurs n'est PAS dans les subItems de Structures, donc ça devrait se refermer
    // Mais selon notre implémentation avec findActiveGroupId, /operateurs ne déclenche pas d'ouverture
  });

  it("affiche les éléments spécifiques pour un utilisateur opérateur au rendu", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: {
        email: "operateur@example.com",
        name: "Jane Operator",
        operateurId: 10,
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
    const operateurLink = screen.getByRole("link", { name: "Opérateur" });
    expect(operateurLink).toHaveAttribute("href", "/operateurs/10");

    // L'opérateur ne devrait pas voir les liens agent
    expect(screen.queryByText("Tableau de bord")).not.toBeInTheDocument();
    expect(screen.queryByText("Voir les structures")).not.toBeInTheDocument();
    expect(screen.queryByText("Opérateurs")).not.toBeInTheDocument();
  });
});
