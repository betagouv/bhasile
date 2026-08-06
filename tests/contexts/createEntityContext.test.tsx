import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  createEntityContext,
  createMutableEntityContext,
} from "@/contexts/createEntityContext";

const { Provider, useValue } = createEntityContext<string>("Test");

const { Provider: MutableProvider, useValue: useMutableValue } =
  createMutableEntityContext<string>("MutableTest");

const EntityLabel = () => {
  const { entity } = useValue();

  return <span>{entity}</span>;
};

const MutableEntityLabel = () => {
  const { entity, setEntity } = useMutableValue();

  return <button onClick={() => setEntity("modifié")}>{entity}</button>;
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

describe("createMutableEntityContext", () => {
  it("expose la valeur mise à jour par setEntity", async () => {
    // GIVEN
    render(
      <MutableProvider entity="avant">
        <MutableEntityLabel />
      </MutableProvider>
    );

    // WHEN
    await userEvent.click(screen.getByRole("button"));

    // THEN
    expect(screen.getByText("modifié")).toBeInTheDocument();
  });

  it("ignore un changement de props une fois monté", () => {
    // GIVEN
    const { rerender } = render(
      <MutableProvider entity="avant">
        <MutableEntityLabel />
      </MutableProvider>
    );

    // WHEN
    rerender(
      <MutableProvider entity="après">
        <MutableEntityLabel />
      </MutableProvider>
    );

    // THEN
    expect(screen.getByText("avant")).toBeInTheDocument();
  });
});
