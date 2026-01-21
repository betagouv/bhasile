import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  SegmentedControl,
  SegmentedControlProps,
} from "@codegouvfr/react-dsfr/SegmentedControl";
import dayjs from "dayjs";
import { ReactElement, useState } from "react";

import { getLastMonths, getMonthsBetween } from "@/app/utils/date.util";

export const ActiviteDurations = ({
  setSelectedMonths,
  debutConvention,
  finConvention,
}: Props): ReactElement => {
  const [selectedDuration, setSelectedDuration] = useState("6months");
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  const getSelectedMonths = (selectedDuration: string): dayjs.Dayjs[] => {
    const selectedMonths: Record<string, dayjs.Dayjs[]> = {
      "6months": getLastMonths(6),
      "12months": getLastMonths(12),
      "24months": getLastMonths(24),
      convention: getMonthsBetween(debutConvention, finConvention),
      custom: getMonthsBetween(customStartDate, customEndDate),
    };
    return selectedMonths[selectedDuration];
  };

  const handleDurationSelection = (selectedDuration: string) => {
    setSelectedDuration(selectedDuration);
    const selectedMonths = getSelectedMonths(selectedDuration);
    setSelectedMonths(selectedMonths);
  };

  const getNativeInputProps = (duration: string) => {
    return {
      value: duration,
      checked: selectedDuration === duration,
      onChange: () => handleDurationSelection(duration),
    };
  };

  const durations: SegmentedControlProps.Segments = [
    {
      label: "6 mois",
      nativeInputProps: getNativeInputProps("6months"),
    },
    {
      label: "12 mois",
      nativeInputProps: getNativeInputProps("12months"),
    },
    {
      label: "24 mois",
      nativeInputProps: getNativeInputProps("24months"),
    },
    {
      label: "Convention",
      nativeInputProps: getNativeInputProps("convention"),
    },
    {
      label: "Autre",
      nativeInputProps: getNativeInputProps("custom"),
    },
  ];

  return (
    <div className="flex items-end">
      <div className="pr-2">
        <SegmentedControl segments={durations} hideLegend={true} />
      </div>
      {selectedDuration === "custom" && (
        <div className="pr-2">
          <Input
            label="Date de début"
            nativeInputProps={{
              type: "date",
              onChange: (event) => {
                setCustomStartDate(event.target.value);
                handleDurationSelection("custom");
              },
            }}
          />
        </div>
      )}
      {selectedDuration === "custom" && (
        <Input
          label="Date de fin"
          nativeInputProps={{
            type: "date",
            onChange: (event) => {
              setCustomEndDate(event.target.value);
              handleDurationSelection("custom");
            },
          }}
        />
      )}
    </div>
  );
};

type Props = {
  setSelectedMonths: (selectedMonths: dayjs.Dayjs[]) => void;
  debutConvention?: string | null;
  finConvention?: string | null;
};
