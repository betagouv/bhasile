import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement } from "react";

export const FinanceTypeSelector = ({
  visualization,
  setVisualization,
}: Props): ReactElement => {
  return (
    <SegmentedControl
      small
      legend=""
      inlineLegend
      className="[&_div]:ml-0 pb-6"
      segments={[
        {
          label: "Total",
          nativeInputProps: {
            value: "total",
            checked: visualization === "total",
            onChange: () => setVisualization("total"),
          },
        },
        {
          label: "Structures autorisées",
          nativeInputProps: {
            value: "autorisees",
            checked: visualization === "autorisees",
            onChange: () => setVisualization("autorisees"),
          },
        },
        {
          label: "Structures subventionnées",
          nativeInputProps: {
            value: "subventionnees",
            checked: visualization === "subventionnees",
            onChange: () => setVisualization("subventionnees"),
          },
        },
      ]}
    />
  );
};

type Props = {
  visualization: "total" | "autorisees" | "subventionnees";
  setVisualization: (
    visualization: "total" | "autorisees" | "subventionnees"
  ) => void;
};
