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
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(
    undefined
  );
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(
    undefined
  );

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

  const getDurations = (): SegmentedControlProps.Segments => {
    const _6months = {
      label: "6 mois",
      nativeInputProps: getNativeInputProps("6months"),
    };
    const _12months = {
      label: "12 mois",
      nativeInputProps: getNativeInputProps("12months"),
    };
    const _24months = {
      label: "24 mois",
      nativeInputProps: getNativeInputProps("24months"),
    };
    const convention = {
      label: "Convention",
      nativeInputProps: getNativeInputProps("convention"),
    };
    const autre = {
      label: "Autre",
      nativeInputProps: getNativeInputProps("custom"),
    };
    if (!debutConvention || !finConvention) {
      return [_6months, _12months, _24months, autre];
    }
    return [_6months, _12months, _24months, convention, autre];
  };

  return (
    <div className="flex items-end">
      <div className="pr-2">
        <SegmentedControl segments={getDurations()} hideLegend={true} />
      </div>
      {selectedDuration === "custom" && (
        <div className="pr-2">
          <Input
            label="Date de début"
            nativeInputProps={{
              type: "date",
              value: customStartDate,
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
            value: customEndDate,
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
