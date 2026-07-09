import { describe, expect, it } from "vitest";

import { deletePaginationParams } from "@/app/utils/searchParams.util";

describe("deletePaginationParams", () => {
  it("supprime le param page", () => {
    const params = new URLSearchParams("page=2&departements=50");
    deletePaginationParams(params);
    expect(params.get("page")).toBeNull();
    expect(params.get("departements")).toBe("50");
  });

  it("supprime tout param suffixé Page (ex. actualisationsPage)", () => {
    const params = new URLSearchParams("actualisationsPage=3&type=CADA");
    deletePaginationParams(params);
    expect(params.get("actualisationsPage")).toBeNull();
    expect(params.get("type")).toBe("CADA");
  });

  it("conserve les params qui ne relèvent pas de la pagination", () => {
    const params = new URLSearchParams("operateurs=1,2&search=foo");
    deletePaginationParams(params);
    expect(params.get("operateurs")).toBe("1,2");
    expect(params.get("search")).toBe("foo");
  });
});
