import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createEntityContext } from "@/contexts/createEntityContext";

const { Provider, useValue } = createEntityContext<string>("Test");

const EntityLabel = () => {
  const { entity } = useValue();

  return <span>{entity}</span>;
};

describe("createEntityContext", () => {
  it("jette quand le hook est appelé hors du provider", () => {
    expect(() => render(<EntityLabel />)).toThrow(
      "useTestContext doit être utilisé à l'intérieur d'un TestProvider"
    );
  });

  it("répercute un changement de props sur la valeur exposée", () => {
    // GIVEN
    const { rerender } = render(
      <Provider entity="avant">
        <EntityLabel />
      </Provider>
    );
    expect(screen.getByText("avant")).toBeInTheDocument();

    // WHEN
    rerender(
      <Provider entity="après">
        <EntityLabel />
      </Provider>
    );

    // THEN
    expect(screen.getByText("après")).toBeInTheDocument();
  });
});
