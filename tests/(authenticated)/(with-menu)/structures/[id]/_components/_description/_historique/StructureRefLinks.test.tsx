import { render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { StructureRefLinks } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/_historique/StructureRefLinks";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

const ref = (id: number) => ({ id, codeBhasile: `BHA-NOR-${id}` });

describe("StructureRefLinks", () => {
  it("rend une seule structure sans séparateur", () => {
    const { container } = render(<StructureRefLinks refs={[ref(1)]} />);

    expect(container.textContent).toBe("BHA-NOR-1");
    expect(screen.getByRole("link", { name: "BHA-NOR-1" })).toHaveAttribute(
      "href",
      "/structures/1"
    );
  });

  it("énumère deux structures avec « et »", () => {
    const { container } = render(<StructureRefLinks refs={[ref(1), ref(2)]} />);

    expect(container.textContent).toBe("BHA-NOR-1 et BHA-NOR-2");
  });

  it("énumère trois structures avec virgules puis « et », liens corrects", () => {
    const { container } = render(
      <StructureRefLinks refs={[ref(1), ref(2), ref(3)]} />
    );

    expect(container.textContent).toBe("BHA-NOR-1, BHA-NOR-2 et BHA-NOR-3");
    expect(screen.getByRole("link", { name: "BHA-NOR-2" })).toHaveAttribute(
      "href",
      "/structures/2"
    );
    expect(screen.getByRole("link", { name: "BHA-NOR-3" })).toHaveAttribute(
      "href",
      "/structures/3"
    );
  });
});
