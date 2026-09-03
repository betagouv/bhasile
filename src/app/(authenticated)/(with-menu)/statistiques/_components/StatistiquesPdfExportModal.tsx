"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useSearchParams } from "next/navigation";
import { ReactElement, useMemo, useState } from "react";

import { usePdfExport } from "@/app/hooks/usePdfExport";
import { formatDate } from "@/app/utils/date.util";
import { computeStartMonth, toYearMonth } from "@/app/utils/pdf-export.util";
import { CURRENT_YEAR, EIG_START_YEAR, START_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { StatistiquesPdfExportDocument } from "./StatistiquesPdfExportDocument";

export const statistiquesPdfExportModal = createModal({
  id: "statistiques-pdf-export-modal",
  isOpenedByDefault: false,
});

export const StatistiquesPdfExportModal = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const { triggerExport, PrintableContainer } = usePdfExport(
    `Statistiques ${formatDate(new Date())}`
  );
  const searchParams = useSearchParams();

  const departements =
    typeof searchParams.get("departements") === "string"
      ? searchParams.get("departements")
      : undefined;
  const operateurs =
    typeof searchParams.get("operateurs") === "string"
      ? searchParams.get("operateurs")
      : undefined;
  const types =
    typeof searchParams.get("types") === "string"
      ? searchParams.get("types")
      : undefined;

  const typePlacesLastYear = statistiques.places.byYear?.[0]?.year || 0;
  const financeLastYear = statistiques.finance.byYear?.[0]?.year || 0;
  const typePlacesFinancesLastYear = Math.max(
    typePlacesLastYear,
    financeLastYear
  );

  const latestActivityDate = statistiques.activite.byMonth?.length
    ? new Date(
        Math.max(
          ...statistiques.activite.byMonth.map((activite) =>
            new Date(activite.date).getTime()
          )
        )
      )
    : new Date();

  const [endYear, setEndYear] = useState<number>(typePlacesFinancesLastYear);
  const [endMonth, setEndMonth] = useState<string>(
    toYearMonth(latestActivityDate)
  );

  const startYear = endYear - 4;
  const startMonth = useMemo(() => computeStartMonth(endMonth), [endMonth]);

  const exportPayload = {
    typePlacesFinancesStartYear: startYear,
    typePlacesFinancesEndYear: endYear,
    activiteStartMonth: startMonth,
    activiteEndMonth: endMonth,
  };

  return (
    <>
      <statistiquesPdfExportModal.Component
        title="Exporter la fiche (PDF)"
        iconId="fr-icon-file-download-line"
        buttons={[
          {
            doClosesModal: true,
            children: "Annuler",
            type: "button",
          },
          {
            doClosesModal: true,
            children: "Exporter en PDF",
            type: "button",
            onClick: () => triggerExport(),
          },
        ]}
      >
        <p>
          Concernant{" "}
          <strong>
            les données “Types de places”, “Contrôle qualité” et “Finance”
          </strong>
          , sur quelle période de <strong>5 ans</strong> souhaitez-vous exporter
          l’historique ?
        </p>
        <div className="flex justify-center gap-4 w-full">
          <div className="flex-1 w-full">
            <Input
              label="Année de début"
              hintText="AAAA"
              iconId="fr-icon-lock-line"
              disabled
              nativeInputProps={{
                value: startYear,
                type: "number",
              }}
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              label="Année de fin"
              hintText="AAAA"
              nativeInputProps={{
                value: endYear,
                onChange: (event) => setEndYear(Number(event.target.value)),
                type: "number",
                max: CURRENT_YEAR + 1,
                min: START_YEAR + 4,
              }}
            />
          </div>
        </div>
        <hr className="my-6" />
        <p>
          Concernant <strong>les données “Activités” (OFII) et “RMU”</strong>,
          sur quelle période de <strong>6 mois</strong> souhaitez-vous exporter
          l’historique ?
        </p>
        <div className="flex justify-center gap-4 w-full">
          <div className="flex-1 w-full">
            <Input
              label="Mois de début"
              iconId="fr-icon-lock-line"
              disabled
              nativeInputProps={{
                value: startMonth,
                type: "month",
              }}
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              label="Mois de fin"
              nativeInputProps={{
                value: endMonth,
                onChange: (event) => setEndMonth(event.target.value),
                type: "month",
                max: new Date().toISOString().slice(0, 7),
                min: new Date(EIG_START_YEAR, 1, 1).toISOString().slice(0, 7),
              }}
            />
          </div>
        </div>
      </statistiquesPdfExportModal.Component>

      <PrintableContainer>
        <StatistiquesPdfExportDocument
          data={exportPayload}
          departements={departements}
          operateurs={operateurs}
          types={types}
        />
      </PrintableContainer>
    </>
  );
};
