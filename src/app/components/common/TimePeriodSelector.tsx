import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement } from "react";

export const TimePeriodSelector = ({
  timePeriod,
  setTimePeriod,
}: Props): ReactElement => {
  return (
    <SegmentedControl
      small
      legend=""
      inlineLegend
      className="[&_div]:ml-0 pb-6"
      segments={[
        {
          label: "Mois",
          nativeInputProps: {
            value: "byMonth",
            checked: timePeriod === "byMonth",
            onChange: () => setTimePeriod("byMonth"),
          },
        },
        {
          label: "Trimestre",
          nativeInputProps: {
            value: "byTrimester",
            checked: timePeriod === "byTrimester",
            onChange: () => setTimePeriod("byTrimester"),
          },
        },
        {
          label: "Année",
          nativeInputProps: {
            value: "byYear",
            checked: timePeriod === "byYear",
            onChange: () => setTimePeriod("byYear"),
          },
        },
      ]}
    />
  );
};

type Props = {
  timePeriod: TimePeriod;
  setTimePeriod: (timePeriod: TimePeriod) => void;
};

export type TimePeriod = "byMonth" | "byTrimester" | "byYear";
