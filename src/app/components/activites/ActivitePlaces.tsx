"use client";

import { ReactElement, ReactNode, useMemo } from "react";

import { PieChart } from "@/components/pie-chart/PieChart";

import { NumberDisplay } from "../common/NumberDisplay";
import { ActivitePlacesLabel } from "./ActivitePlacesLabel";

export const ActivitePlaces = ({
  placesAutorisees = 0,
  placesDisponibles = 0,
  placesIndisponibles = 0,
  placesCaes = 0,
}: Props): ReactElement => {
  const indisponibles = Number(placesIndisponibles ?? 0);
  const disponibles = Number(placesDisponibles ?? 0);
  const caes = Number(placesCaes ?? 0);
  const total = disponibles + indisponibles + caes;

  const slices = useMemo(
    () => buildSlices({ indisponibles, caes, disponibles }),
    [indisponibles, caes, disponibles]
  );

  const chartData = useMemo(
    () => ({
      labels: slices.map(({ kind }) => SLICE_CHART_LABELS[kind]),
      series: slices.map(({ value }) => value),
    }),
    [slices]
  );

  const calloutLabels = slices.map(({ kind, value }) => (
    <ActivitePlacesLabel key={kind} value={value} total={total}>
      {SLICE_CALLOUT_TEXTS[kind]}
    </ActivitePlacesLabel>
  ));

  return (
    <div className="pt-3">
      <PieChart
        size={180}
        data={chartData}
        options={pieChartOptions}
        isDonut
        colors={[
          "var(--grey-925-125)",
          "var(--yellow-moutarde-main-679)",
          "var(--yellow-moutarde-850-200)",
        ]}
        calloutLabels={calloutLabels}
      >
        <div className="w-22 text-sm text-center">
          <strong>
            <NumberDisplay value={placesAutorisees} />
          </strong>{" "}
          places enregistrées DNA
        </div>
      </PieChart>
    </div>
  );
};

const buildSlices = ({
  indisponibles,
  caes,
  disponibles,
}: Record<SliceKind, number>): Slice[] => [
  { kind: "indisponibles", value: indisponibles },
  ...(caes ? [{ kind: "caes" as const, value: caes }] : []),
  { kind: "disponibles", value: disponibles },
];

const SLICE_CHART_LABELS: Record<SliceKind, string> = {
  indisponibles: "Places indisponibles",
  caes: "Places CAES",
  disponibles: "Places disponibles",
};

const SLICE_CALLOUT_TEXTS: Record<SliceKind, ReactNode> = {
  indisponibles: "indisponibles",
  caes: (
    <>
      places en CAES{" "}
      <span className="italic">– indisponibilité non suivie</span>
    </>
  ),
  disponibles: "disponibles",
};

const pieChartOptions = {
  showLabel: false,
  donut: true,
  donutWidth: 30,
};

type SliceKind = "indisponibles" | "caes" | "disponibles";

type Slice = { kind: SliceKind; value: number };

type Props = {
  placesAutorisees?: number;
  placesDisponibles?: number | null;
  placesIndisponibles?: number | null;
  placesCaes?: number | null;
};
