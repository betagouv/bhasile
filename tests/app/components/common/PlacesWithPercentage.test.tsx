import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlacesWithPercentage } from "@/app/components/common/PlacesWithPercentage";

describe("PlacesWithPercentage", () => {
  it("affiche la valeur et son pourcentage des places autorisées", () => {
    // GIVEN
    render(<PlacesWithPercentage value={12} placesAutorisees={38} />);

    // THEN
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("31 %")).toBeInTheDocument();
  });

  it.each([undefined, null, 0])(
    "n'affiche que la valeur quand les places autorisées valent %s",
    (placesAutorisees) => {
      // GIVEN
      const { container } = render(
        <PlacesWithPercentage value={5} placesAutorisees={placesAutorisees} />
      );

      // THEN
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(container).not.toHaveTextContent("%");
    }
  );

  it("affiche 0 % quand la valeur est nulle et les places autorisées renseignées", () => {
    // GIVEN
    render(<PlacesWithPercentage value={0} placesAutorisees={38} />);

    // THEN
    expect(screen.getByText("0 %")).toBeInTheDocument();
  });
});
