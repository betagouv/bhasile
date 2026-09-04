"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import { useExportContext } from "@/contexts/ExportContext";

import { TypeChartPresenter } from "./TypeChartPresenter";

type Props = {
  title: string;
  colors: string[];
  typeAccessor: "structureTypes" | "structureBatis";
};

export const GenericTypeChart = ({
  title,
  colors,
  typeAccessor,
}: Props): ReactElement => {
  const isExporting = useExportContext();
  const [visualization, setVisualization] = useState<"structures" | "places">(
    "structures"
  );

  if (isExporting) {
    return (
      <div className="space-y-6">
        <h4 className="text-title-blue-france text-lg">{title}</h4>
        <div>
          <h5 className="font-semibold text-sm mb-2 text-mention-grey">
            Par structures
          </h5>
          <TypeChartPresenter
            colors={colors}
            typeAccessor={typeAccessor}
            visualization="structures"
          />
        </div>
        <div>
          <h5 className="font-semibold text-sm mb-2 text-mention-grey">
            Par places
          </h5>
          <TypeChartPresenter
            colors={colors}
            typeAccessor={typeAccessor}
            visualization="places"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-title-blue-france text-lg">{title}</h4>
      <SegmentedControl
        small
        legend=""
        inlineLegend
        className="[&_div]:ml-0 pb-6"
        segments={[
          {
            iconId: "fr-icon-community-line",
            label: "Structures",
            nativeInputProps: {
              value: "structures",
              checked: visualization === "structures",
              onChange: () => setVisualization("structures"),
            },
          },
          {
            iconId: "fr-icon-team-line",
            label: "Places",
            nativeInputProps: {
              value: "places",
              checked: visualization === "places",
              onChange: () => setVisualization("places"),
            },
          },
        ]}
      />
      <TypeChartPresenter
        colors={colors}
        typeAccessor={typeAccessor}
        visualization={visualization}
      />
    </div>
  );
};
