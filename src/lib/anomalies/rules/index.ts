import type { AnomalieRule } from "@/lib/anomalies/anomalie.rule";
import { ACTIVITE_RULES } from "@/lib/anomalies/rules/activite.rule";
import { CALENDAR_RULES } from "@/lib/anomalies/rules/calendar.rule";
import { CHARACTERISTICS_RULES } from "@/lib/anomalies/rules/characteristics.rule";
import { DOCUMENTS_RULES } from "@/lib/anomalies/rules/documents.rule";
import { FINANCE_RULES } from "@/lib/anomalies/rules/finance.rule";
import { PLACES_RULES } from "@/lib/anomalies/rules/places.rule";

export const ANOMALIE_RULES: AnomalieRule[] = [
  ...CALENDAR_RULES,
  ...PLACES_RULES,
  ...CHARACTERISTICS_RULES,
  ...FINANCE_RULES,
  ...DOCUMENTS_RULES,
  ...ACTIVITE_RULES,
];
