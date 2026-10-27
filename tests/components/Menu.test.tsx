import { fireEvent, render, screen } from "@testing-library/react";
import client from "next-auth/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { Menu } from "@/app/components/Menu";
import { BHASILE_CONTACT_EMAIL } from "@/constants";

vitest.mock("next-auth/react");

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const getGroupButton = (name: string) => screen.getByRole("button", { name });

describe("Menu", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_PARAMETRES", "true");
    mockPathname.mockReturnValue("/");
  });

  it("affiche les éléments de l'en-tête au rendu", () => {
    // GIVEN
    const mockSession = {
      expires: "1",
      user: { email: "test@example.com", name: "John Doe" },
    };

    (client.useSession as Mock).mockReturnValueOnce([mockSession, false]);

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
  it("déploie Structures et opérateurs par défaut", () => {
    // GIVEN
    render(<Menu />);

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(getGroupButton("Paramètres")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByText("Voir mon compte")).not.toBeInTheDocument();
  });

  it("replie Structures et opérateurs quand Paramètres est déployé", () => {
    // GIVEN
    render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Paramètres"));

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByText("Voir les structures")).not.toBeInTheDocument();
    expect(screen.getByText("Voir mon compte")).toBeInTheDocument();
  });

  it("redéploie Structures et opérateurs quand Paramètres est replié", () => {
    // GIVEN
    render(<Menu />);
    fireEvent.click(getGroupButton("Paramètres"));

    // WHEN
    fireEvent.click(getGroupButton("Paramètres"));

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.queryByText("Voir mon compte")).not.toBeInTheDocument();
  });

  it("garde Structures et opérateurs déployé au clic sur son en-tête", () => {
    // GIVEN
    render(<Menu />);

    // WHEN
    fireEvent.click(getGroupButton("Structures et opérateurs"));

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("déploie Paramètres sur une page de paramètres", () => {
    // GIVEN
    mockPathname.mockReturnValue("/parametres/compte");

    // WHEN
    render(<Menu />);

    // THEN
    expect(getGroupButton("Paramètres")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.queryByText("Voir les structures")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir mon compte" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("redéploie Structures et opérateurs en quittant les paramètres", () => {
    // GIVEN
    mockPathname.mockReturnValue("/parametres/compte");
    const { rerender } = render(<Menu />);

    // WHEN
    mockPathname.mockReturnValue("/statistiques");
    rerender(<Menu />);

    // THEN
    expect(getGroupButton("Structures et opérateurs")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.queryByText("Voir mon compte")).not.toBeInTheDocument();
  });

  it("masque Paramètres sans le flag", () => {
    // GIVEN
    vi.stubEnv("NEXT_PUBLIC_SHOW_PARAMETRES", "false");

    // WHEN
    render(<Menu />);

    // THEN
    expect(
      screen.queryByRole("button", { name: "Paramètres" })
    ).not.toBeInTheDocument();
  });
});
