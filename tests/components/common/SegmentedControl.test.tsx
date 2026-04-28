import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";

describe("SegmentedControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use isChecked as default when uncontrolled", () => {
    // GIVEN
    render(
      <SegmentedControl
        name="visualisation"
        options={[
          {
            id: "tableau",
            isChecked: true,
            label: "Tableau",
            value: "tableau",
          },
          { id: "carte", isChecked: false, label: "Carte", value: "carte" },
        ]}
      />
    );

    // THEN
    expect(screen.getByLabelText("Tableau")).toBeChecked();
    expect(screen.getByLabelText("Carte")).not.toBeChecked();
  });

  it("should be controllable with value and call onChange", async () => {
    // GIVEN
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <SegmentedControl
        name="visualisation"
        value="carte"
        options={[
          {
            id: "tableau",
            isChecked: true,
            label: "Tableau",
            value: "tableau",
          },
          { id: "carte", isChecked: false, label: "Carte", value: "carte" },
        ]}
        onChange={onChange}
      />
    );

    // THEN
    expect(screen.getByLabelText("Carte")).toBeChecked();
    expect(screen.getByLabelText("Tableau")).not.toBeChecked();

    // WHEN
    await user.click(screen.getByLabelText("Tableau"));

    // THEN
    expect(onChange).toHaveBeenCalledWith("tableau");

    // WHEN
    rerender(
      <SegmentedControl
        name="visualisation"
        value="tableau"
        options={[
          {
            id: "tableau",
            isChecked: false,
            label: "Tableau",
            value: "tableau",
          },
          { id: "carte", isChecked: true, label: "Carte", value: "carte" },
        ]}
        onChange={onChange}
      />
    );

    // THEN
    expect(screen.getByLabelText("Tableau")).toBeChecked();
    expect(screen.getByLabelText("Carte")).not.toBeChecked();
  });
});

