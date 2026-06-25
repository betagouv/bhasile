import dayjs from "dayjs";

import { HistoryEvent } from "@/types/structure-history.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type FinanceMarkerType =
  | typeof StructureVersionTransformationType.EXTENSION
  | typeof StructureVersionTransformationType.CONTRACTION;

export type FinanceTransformationMarkerEvent = {
  date: string;
  type: FinanceMarkerType;
};

export type FinanceTransformationMarker = {
  year: number;
  events: FinanceTransformationMarkerEvent[];
  badge: FinanceMarkerType | "MIXED";
};

export const getFinanceTransformationMarkers = (
  history: HistoryEvent[] | undefined,
  years: number[]
): FinanceTransformationMarker[] => {
  if (!history || years.length === 0) {
    return [];
  }

  const displayedYears = new Set(years);
  const firstDisplayedYear = Math.min(...years);

  const eventsByYear = new Map<number, FinanceTransformationMarkerEvent[]>();

  const filteredHistory = history.filter(
    (event) => event.kind === "CONTRACTION" || event.kind === "EXTENSION"
  );

  for (const event of filteredHistory) {
    const year = dayjs(event.date).year();
    if (!displayedYears.has(year) || year === firstDisplayedYear) {
      continue;
    }

    const yearEvents = eventsByYear.get(year) ?? [];
    yearEvents.push({ date: event.date, type: event.kind });
    eventsByYear.set(year, yearEvents);
  }

  return Array.from(eventsByYear.entries())
    .map(([year, events]) => {
      const sortedEvents = [...events].sort((first, second) =>
        first.date.localeCompare(second.date)
      );
      const distinctTypes = new Set(sortedEvents.map((event) => event.type));
      const badge =
        distinctTypes.size === 1 ? sortedEvents[0].type : ("MIXED" as const);

      return { year, events: sortedEvents, badge };
    })
    .sort((first, second) => first.year - second.year);
};
