"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { ReactElement, useMemo, useState } from "react";

import { usePdfExport } from "@/app/hooks/usePdfExport";
import { computeStartMonth, toYearMonth } from "@/app/utils/pdf-export.util";
import { useStructureContext } from "@/contexts/StructureContext";

export const pdfExportModal = createModal({
  id: "pdf-export-modal",
  isOpenedByDefault: false,
});

export const PdfExportModal = (): ReactElement => {
  const { structure } = useStructureContext();
  const { triggerExport, PrintableContainer } = usePdfExport(
    structure.codeBhasile
  );

  const typePlacesLastYear = structure.structureTypologies?.[0]?.year || 0;
  const financeLastYear = structure.budgets?.[0]?.year || 0;
  const typePlacesFinancesLastYear = Math.max(
    typePlacesLastYear,
    financeLastYear
  );

  const latestActivityDate = structure.activites?.length
    ? new Date(
        Math.max(
          ...structure.activites.map((activite) =>
            new Date(activite.date).getTime()
          )
        )
      )
    : new Date();

  const [exportAddresses, setExportAddresses] = useState<"oui" | "non">("non");
  const [endYear, setEndYear] = useState<number>(typePlacesFinancesLastYear);
  const [endMonth, setEndMonth] = useState<string>(
    toYearMonth(latestActivityDate)
  );

  const startYear = endYear - 4;
  const startMonth = useMemo(() => computeStartMonth(endMonth), [endMonth]);

  const exportPayload = {
    exportAddresses: exportAddresses === "oui",
    typePlacesFinances: { startYear, endYear },
    ofii: { startMonth, endMonth },
  };

  return (
    <>
      <pdfExportModal.Component
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
          Voulez-vous exporter{" "}
          <strong>la liste des adresses d’hébergement</strong> ?
        </p>
        <div className="flex justify-center">
          <RadioButtons
            options={[
              {
                label: "Oui",
                nativeInputProps: {
                  value: "oui",
                  checked: exportAddresses === "oui",
                  onChange: () => setExportAddresses("oui"),
                },
              },
              {
                label: "Non",
                nativeInputProps: {
                  value: "non",
                  checked: exportAddresses === "non",
                  onChange: () => setExportAddresses("non"),
                },
              },
            ]}
            orientation="horizontal"
            small
          />
        </div>
        <hr />
        <p>
          Concernant <strong>les données “Types de places” et “Finance”</strong>
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
              }}
            />
          </div>
        </div>
        <hr className="my-6" />
        <p>
          Concernant <strong>les données “Activités” (OFII)</strong>, sur quelle
          période de <strong>6 mois</strong> souhaitez-vous exporter
          l’historique ?
        </p>
        <div className="flex justify-center gap-4 w-full">
          <div className="flex-1 w-full">
            <Input
              label="Mois de début"
              hintText="Obligatoire"
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
              hintText="Obligatoire"
              nativeInputProps={{
                value: endMonth,
                onChange: (event) => setEndMonth(event.target.value),
                type: "month",
              }}
            />
          </div>
        </div>
      </pdfExportModal.Component>

      <PrintableContainer data={exportPayload} />
    </>
  );
};
