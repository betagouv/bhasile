import { describe, expect, it } from "vitest";

import {
  addDashboardOrigin,
  getBackHref,
  keepDashboardOrigin,
} from "@/utils/dashboardOrigin.util";

describe("addDashboardOrigin", () => {
  it("ajoute from=dashboard à une url sans query string", () => {
    expect(addDashboardOrigin("/structures/42")).toBe(
      "/structures/42?from=dashboard"
    );
  });

  it("ajoute from=dashboard à la suite d'une query string existante", () => {
    expect(addDashboardOrigin("/structures/42?tab=notes")).toBe(
      "/structures/42?tab=notes&from=dashboard"
    );
  });

  it("place from=dashboard avant l'ancre", () => {
    expect(addDashboardOrigin("/structures/42#controles")).toBe(
      "/structures/42?from=dashboard#controles"
    );
  });
});

describe("keepDashboardOrigin", () => {
  it("propage from=dashboard quand l'url courante le porte", () => {
    const searchParams = new URLSearchParams("from=dashboard");

    expect(
      keepDashboardOrigin("/structures/transformation/7/etape", searchParams)
    ).toBe("/structures/transformation/7/etape?from=dashboard");
  });

  it("laisse l'url intacte quand l'url courante ne vient pas du dashboard", () => {
    const searchParams = new URLSearchParams("from=ailleurs");

    expect(
      keepDashboardOrigin("/structures/transformation/7/etape", searchParams)
    ).toBe("/structures/transformation/7/etape");
  });
});

describe("getBackHref", () => {
  it("renvoie le tableau de bord quand on vient du dashboard", () => {
    const searchParams = new URLSearchParams("from=dashboard");

    expect(getBackHref(searchParams, "/structures")).toBe("/");
  });

  it("renvoie le repli sans paramètre d'origine", () => {
    expect(getBackHref(new URLSearchParams(), "/structures")).toBe(
      "/structures"
    );
  });

  it("ignore une valeur d'origine inconnue", () => {
    const searchParams = new URLSearchParams("from=https://evil.example");

    expect(getBackHref(searchParams, "/structures")).toBe("/structures");
  });
});
