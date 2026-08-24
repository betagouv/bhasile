"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement } from "react";

import { useSearchParamsNavigation } from "@/app/hooks/useSearchParamsNavigation";
import { useUserAction } from "@/app/hooks/useUserAction";
import { Visualization } from "@/types/structure-list.type";

export const VisualizationTabs = ({ vue }: Props): ReactElement => {
  const navigateWithParams = useSearchParamsNavigation();
  const { trackStructuresCartographie } = useUserAction();

  const handleChange = (next: Visualization) => {
    if (next === "carte") {
      trackStructuresCartographie();
    }
    navigateWithParams((params) => params.set("vue", next));
  };

  return (
    <SegmentedControl
      small
      legend=""
      inlineLegend
      className="[&_div]:ml-0"
      segments={[
        {
          iconId: "fr-icon-survey-line",
          label: "Tableau",
          nativeInputProps: {
            value: "tableau",
            checked: vue === "tableau",
            onChange: () => handleChange("tableau"),
          },
        },
        {
          iconId: "fr-icon-road-map-line",
          label: "Carte",
          nativeInputProps: {
            value: "carte",
            checked: vue === "carte",
            onChange: () => handleChange("carte"),
          },
        },
      ]}
    />
  );
};

type Props = {
  vue: Visualization;
};
