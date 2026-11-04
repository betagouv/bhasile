"use client";

import { ReactElement, useState } from "react";

import { cn } from "@/app/utils/classname.util";
import type { SpreadsheetPreviewSheet } from "@/utils/spreadsheet-preview.util";

export const SpreadsheetPreview = ({ sheets }: Props): ReactElement => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const { name, zoomRatio, columns, rows, overflowRowCount } =
    sheets[selectedSheetIndex];
  const tableWidthPx =
    ROW_HEADER_WIDTH_PX +
    columns.reduce((total, { widthPx }) => total + widthPx, 0);

  return (
    <div className="grow min-w-0 flex flex-col gap-2 bg-white rounded-xl border border-border-default-grey p-3">
      <p className="mb-0 text-xs text-mention-grey">
        Aperçu simplifié, sans graphiques, images, mise en forme conditionnelle
        ni éléments masqués. Téléchargez le fichier pour les voir.
      </p>
      <div
        className="overflow-auto max-h-[40rem] bg-white text-black"
        role="region"
        aria-label={`Feuille ${name}`}
        tabIndex={0}
      >
        <table
          className="table-fixed border-collapse text-[11pt] leading-tight [font-family:Calibri,Carlito,Arial,sans-serif]"
          style={{ width: tableWidthPx, zoom: zoomRatio }}
        >
          <colgroup>
            <col style={{ width: ROW_HEADER_WIDTH_PX }} />
            {columns.map(({ letter, widthPx }) => (
              <col key={letter} style={{ width: widthPx }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={cn(HEADER_CLASSES, "sticky top-0 left-0 z-20")} />
              {columns.map(({ letter }) => (
                <th
                  key={letter}
                  scope="col"
                  className={cn(HEADER_CLASSES, "sticky top-0 z-10")}
                >
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ number, heightPt, cells }) => (
              <tr key={number} style={{ height: heightPt && `${heightPt}pt` }}>
                <th
                  scope="row"
                  className={cn(HEADER_CLASSES, "sticky left-0 z-10")}
                >
                  {number}
                </th>
                {cells.map(({ text, colSpan, rowSpan, style }, cellIndex) => (
                  <td
                    key={cellIndex}
                    colSpan={colSpan}
                    rowSpan={rowSpan}
                    className="px-1"
                    style={style}
                    title={text || undefined}
                  >
                    {text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {overflowRowCount > 0 && (
        <p className="mb-0 text-xs text-mention-grey">
          {overflowRowCount} ligne{overflowRowCount > 1 ? "s" : ""} de plus dans
          le fichier : téléchargez-le pour les voir.
        </p>
      )}
      {sheets.length > 1 && (
        <div
          className="flex gap-1 flex-wrap"
          aria-label="Feuilles"
          role="group"
        >
          {sheets.map(({ name: sheetName }, sheetIndex) => (
            <button
              key={sheetName}
              type="button"
              aria-pressed={sheetIndex === selectedSheetIndex}
              onClick={() => setSelectedSheetIndex(sheetIndex)}
              className={cn(
                "text-sm rounded px-3 py-1",
                sheetIndex === selectedSheetIndex
                  ? "bg-active-blue-france text-white"
                  : "bg-alt-blue-france text-title-blue-france"
              )}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ROW_HEADER_WIDTH_PX = 40;

const HEADER_CLASSES =
  "bg-[#f0f0f0] text-[#555555] text-xs font-normal text-center border border-[#d4d4d4]";

type Props = {
  sheets: SpreadsheetPreviewSheet[];
};
