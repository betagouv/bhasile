"use client";

import { ReactElement } from "react";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
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
      key={vue}
      name="Visualisation"
      options={OPTIONS.map((option) => ({
        ...option,
        isChecked: option.value === vue,
      }))}
      onChange={(event) => handleChange(event as Visualization)}
    >
      <h2
        className="text-title-blue-france fr-h5 mr-4 mb-0"
        id="structures-titre"
      >
        Structures d’hébergement
      </h2>
    </SegmentedControl>
  );
};

type Props = {
  vue: Visualization;
};

const OPTIONS = [
  {
    id: "tableau",
    label: "Tableau",
    value: "tableau",
    icon: "fr-icon-survey-line",
  },
  {
    id: "carte",
    label: "Carte",
    value: "carte",
    icon: "fr-icon-road-map-line",
  },
];
