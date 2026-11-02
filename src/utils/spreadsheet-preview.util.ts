import type { Borders, Cell, CellValue, Row, Worksheet } from "exceljs";
import type { CSSProperties } from "react";

// Importés à la demande : ces décodeurs ne pèsent que sur la page de qui ouvre un tableur
export const parseSpreadsheetPreview = async (
  content: Blob
): Promise<SpreadsheetPreviewSheet[]> => {
  const [{ Workbook }, { format: formatNumber }] = await Promise.all([
    import("exceljs"),
    import("ssf"),
  ]);
  const workbook = new Workbook();
  await workbook.xlsx.load(await content.arrayBuffer());
  const visibleSheets = workbook.worksheets.filter(
    ({ state }) => state === "visible"
  );
  if (visibleSheets.length === 0) {
    throw new Error("Ce classeur n'a pas de feuille de données à afficher");
  }
  // `workbook.model` sérialiserait toutes les feuilles, deux fois, pour lire ce seul champ
  const { _themes: themes } = workbook as unknown as {
    _themes?: Record<string, string>;
  };
  const themeColors = parseThemeColors(Object.values(themes ?? {})[0]);
  return visibleSheets.map((worksheet) =>
    buildSheet(worksheet, { formatNumber, themeColors })
  );
};

const buildSheet = (
  worksheet: Worksheet,
  context: RenderingContext
): SpreadsheetPreviewSheet => {
  const { lastRowNumber, lastColumnNumber } = findContentBounds(worksheet);
  const columns = listNumbers(lastColumnNumber)
    .map((number) => worksheet.getColumn(number))
    .filter(({ hidden }) => !hidden);
  const visibleRows = listNumbers(lastRowNumber)
    .map((number) => worksheet.getRow(number))
    .filter(({ hidden }) => !hidden);
  const rows = visibleRows.slice(0, SPREADSHEET_PREVIEW_MAX_ROWS);
  const mergeSpans = computeMergeSpans(rows, columns);
  const showsGridLines = worksheet.views?.[0]?.showGridLines !== false;

  return {
    name: worksheet.name,
    zoomRatio: (worksheet.views?.[0]?.zoomScale ?? 100) / 100,
    columns: columns.map((column) => ({
      letter: column.letter,
      widthPx: toColumnWidthPx(
        column.width ?? worksheet.properties.defaultColWidth
      ),
    })),
    rows: rows.map((row) => ({
      number: row.number,
      heightPt: row.height,
      cells: columns.flatMap((column, columnIndex) => {
        const cell = row.getCell(column.number);
        if (cell.master !== cell && mergeSpans.has(cell.master.address)) {
          return [];
        }
        const nextColumn = columns[columnIndex + 1];
        const hasFilledNeighbour =
          !!nextColumn && row.getCell(nextColumn.number).value !== null;
        const span = mergeSpans.get(cell.address);
        return [
          buildCell(cell, {
            ...context,
            span,
            border: span
              ? readMergedBorder(cell, span, rows, columns)
              : cell.border,
            showsGridLines,
            hasFilledNeighbour,
          }),
        ];
      }),
    })),
    overflowRowCount: Math.max(
      visibleRows.length - SPREADSHEET_PREVIEW_MAX_ROWS,
      0
    ),
  };
};

// `rowCount` et `columnCount` comptent les cellules vides mais mises en forme, souvent jusqu'au bas d'un modèle
const findContentBounds = (
  worksheet: Worksheet
): { lastRowNumber: number; lastColumnNumber: number } => {
  let lastRowNumber = 0;
  let lastColumnNumber = 0;
  worksheet.eachRow((row, rowNumber) => {
    lastRowNumber = rowNumber;
    row.eachCell((_cell, columnNumber) => {
      lastColumnNumber = Math.max(lastColumnNumber, columnNumber);
    });
  });
  return { lastRowNumber, lastColumnNumber };
};

const listNumbers = (lastNumber: number): number[] =>
  Array.from({ length: lastNumber }, (_value, index) => index + 1);

const computeMergeSpans = (
  rows: Row[],
  columns: SheetColumn[]
): Map<string, MergeSpan> => {
  const spans = new Map<string, MergeSpan>();
  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(column.number);
      if (!cell.isMerged) {
        return;
      }
      const span = spans.get(cell.master.address);
      if (span) {
        span.colSpan = Math.max(
          span.colSpan,
          columnIndex - span.columnIndex + 1
        );
        span.rowSpan = Math.max(span.rowSpan, rowIndex - span.rowIndex + 1);
      } else if (cell.master === cell) {
        spans.set(cell.address, {
          rowIndex,
          columnIndex,
          colSpan: 1,
          rowSpan: 1,
        });
      }
    });
  });
  return spans;
};

// Excel garde le style de chaque cellule fusionnée : les bords droit et bas du bloc sont portés par ses cellules de bord
const readMergedBorder = (
  cell: Cell,
  span: MergeSpan,
  rows: Row[],
  columns: SheetColumn[]
): Partial<Borders> => {
  const rightEdge = rows[span.rowIndex].getCell(
    columns[span.columnIndex + span.colSpan - 1].number
  );
  const bottomEdge = rows[span.rowIndex + span.rowSpan - 1].getCell(
    columns[span.columnIndex].number
  );
  return {
    ...cell.border,
    right: rightEdge.border?.right ?? cell.border?.right,
    bottom: bottomEdge.border?.bottom ?? cell.border?.bottom,
  };
};

const buildCell = (
  cell: Cell,
  context: CellContext
): SpreadsheetPreviewCell => {
  // Une cellule fusionnée renvoie la valeur de sa maîtresse : sans elle à l'écran, elle la répéterait
  const content = cell.master === cell ? readCellContent(cell.value) : null;
  const { font, alignment, fill } = cell;
  const backgroundColor =
    fill?.type === "pattern" && fill.pattern === "solid"
      ? resolveColor(fill.fgColor, context.themeColors)
      : undefined;
  const isText = typeof content === "string";
  const isClipped = !isText || context.hasFilledNeighbour;

  return {
    text: formatCellContent(content, cell.numFmt, context.formatNumber),
    colSpan: context.span?.colSpan ?? 1,
    rowSpan: context.span?.rowSpan ?? 1,
    style: {
      backgroundColor,
      color: resolveColor(font?.color, context.themeColors),
      fontWeight: font?.bold ? "bold" : undefined,
      fontStyle: font?.italic ? "italic" : undefined,
      fontSize: font?.size ? `${font.size}pt` : undefined,
      textDecoration: font?.underline ? "underline" : undefined,
      textAlign: resolveTextAlign(alignment?.horizontal, content),
      verticalAlign: resolveVerticalAlign(alignment?.vertical),
      whiteSpace: alignment?.wrapText ? "pre-wrap" : "pre",
      overflow: isClipped || alignment?.wrapText ? "hidden" : "visible",
      textOverflow: isClipped ? "ellipsis" : undefined,
      paddingLeft: alignment?.indent ? `${alignment.indent}em` : undefined,
      boxShadow:
        context.showsGridLines && !backgroundColor
          ? GRID_LINE_SHADOW
          : undefined,
      ...buildBorderStyle(context.border, context.themeColors),
    },
  };
};

const readCellContent = (value: CellValue): CellContent => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "object" || value instanceof Date) {
    return value;
  }
  if ("richText" in value) {
    return value.richText.map(({ text }) => text).join("");
  }
  if ("hyperlink" in value) {
    return readCellContent(value.text);
  }
  if ("error" in value) {
    return value.error;
  }
  if ("result" in value) {
    return readCellContent(value.result as CellValue);
  }
  return null;
};

const formatCellContent = (
  content: CellContent,
  numFmt: string | undefined,
  formatNumber: NumberFormatter
): string => {
  if (content === null) {
    return "";
  }
  if (content instanceof Date) {
    return formatDate(content, numFmt, formatNumber);
  }
  if (typeof content === "boolean") {
    return content ? "Oui" : "Non";
  }
  if (typeof content === "number") {
    return formatNumberToFrench(content, numFmt, formatNumber);
  }
  return content;
};

// Excel stocke les formats à l'américaine : `#,##0.00` s'affiche « 1 234,50 » sur un poste français
const formatNumberToFrench = (
  value: number,
  numFmt: string | undefined,
  formatNumber: NumberFormatter
): string => {
  try {
    return formatNumber(numFmt || "General", value)
      .replace(/(\d),(?=\d{3})/g, "$1\u202f")
      .replace(/\.(?=\d)/g, ",");
  } catch {
    return String(value).replace(".", ",");
  }
};

// Le format d'une date dépend du poste (`mm-dd-yy` s'affiche « 31/03/27 » en France) : seules les heures et les durées suivent celui du fichier
const formatDate = (
  date: Date,
  numFmt = "",
  formatNumber: NumberFormatter
): string => {
  const pattern = numFmt.replace(/"[^"]*"|\[(?!h+\]|m+\]|s+\])[^\]]*\]/gi, "");
  const time = { hour: "2-digit", minute: "2-digit" } as const;
  const hasTime = /[hs]|\[m+\]/i.test(pattern);
  if (hasTime && !/[dy]/i.test(pattern)) {
    try {
      return formatNumber(
        numFmt,
        date.getTime() / MS_PER_DAY + UNIX_EPOCH_SERIAL
      );
    } catch {
      return date.toLocaleTimeString("fr-FR", { ...time, timeZone: "UTC" });
    }
  }
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(hasTime ? time : {}),
    timeZone: "UTC",
  });
};

const resolveTextAlign = (
  horizontal: string | undefined,
  content: CellContent
): CSSProperties["textAlign"] => {
  if (horizontal === "center" || horizontal === "centerContinuous") {
    return "center";
  }
  if (horizontal === "left" || horizontal === "right") {
    return horizontal;
  }
  if (horizontal === "justify") {
    return "justify";
  }
  if (typeof content === "boolean") {
    return "center";
  }
  return typeof content === "number" || content instanceof Date
    ? "right"
    : "left";
};

const resolveVerticalAlign = (
  vertical: string | undefined
): CSSProperties["verticalAlign"] => {
  if (vertical === "top" || vertical === "middle") {
    return vertical;
  }
  return "bottom";
};

const buildBorderStyle = (
  border: Partial<Borders> | undefined,
  themeColors: string[]
): CSSProperties => {
  const buildSide = (side: Partial<Borders>["top"]): string | undefined => {
    if (!side?.style) {
      return undefined;
    }
    const color = resolveColor(side.color, themeColors) ?? "#000000";
    return `${BORDER_STYLES[side.style] ?? "1px solid"} ${color}`;
  };
  return {
    borderTop: buildSide(border?.top),
    borderRight: buildSide(border?.right),
    borderBottom: buildSide(border?.bottom),
    borderLeft: buildSide(border?.left),
  };
};

// Couleur lue dans un fichier non fiable : seul un code hexadécimal validé passe tel quel
const resolveColor = (
  color: SpreadsheetColor | undefined,
  themeColors: string[]
): string | undefined => {
  if (color?.argb && /^[0-9a-f]{8}$/i.test(color.argb)) {
    return `#${color.argb.slice(2)}`;
  }
  const indexedColor =
    color?.indexed === undefined ? undefined : INDEXED_COLORS[color.indexed];
  if (indexedColor) {
    return `#${indexedColor}`;
  }
  const themeColor =
    color?.theme === undefined ? undefined : themeColors[color.theme];
  return themeColor && applyTint(themeColor, color?.tint ?? 0);
};

const applyTint = (hexColor: string, tint: number): string => {
  const channels = hexColor.match(/.{2}/g) ?? [];
  const tinted = channels.map((channel) => {
    const value = Number.parseInt(channel, 16);
    const adjusted =
      tint < 0 ? value * (1 + tint) : value + (255 - value) * tint;
    return Math.round(adjusted).toString(16).padStart(2, "0");
  });
  return `#${tinted.join("")}`;
};

const parseThemeColors = (themeXml: string | undefined): string[] =>
  THEME_COLOR_NAMES.map(
    (name) =>
      themeXml?.match(
        new RegExp(
          `<a:${name}>\\s*<a:\\w+[^>]*?(?:lastClr|val)="([0-9a-f]{6})"`,
          "i"
        )
      )?.[1] ?? ""
  );

const toColumnWidthPx = (widthInCharacters = DEFAULT_COLUMN_WIDTH): number =>
  Math.round(widthInCharacters * 7 + 5);

// Un tableur de 30 Mo peut compter des centaines de milliers de lignes : le DOM ne les supporterait pas
const SPREADSHEET_PREVIEW_MAX_ROWS = 1000;

const DEFAULT_COLUMN_WIDTH = 8.43;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const UNIX_EPOCH_SERIAL = 25569;

// Palette héritée du format xls, encore courante : les index 64 et 65 sont les couleurs système, donc la couleur par défaut
const INDEXED_COLORS =
  "000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 800000 008000 000080 808000 800080 008080 C0C0C0 808080 9999FF 993366 FFFFCC CCFFFF 660066 FF8080 0066CC CCCCFF 000080 FF00FF FFFF00 00FFFF 800080 800000 008080 0000FF 00CCFF CCFFFF CCFFCC FFFF99 99CCFF FF99CC CC99FF FFCC99 3366FF 33CCCC 99CC00 FFCC00 FF9900 FF6600 666699 969696 003366 339966 003300 333300 993300 993366 333399 333333".split(
    " "
  );

const GRID_LINE_SHADOW = "inset -1px -1px 0 #e5e5e5";

const BORDER_STYLES: Record<string, string> = {
  hair: "1px dotted",
  dotted: "1px dotted",
  thin: "1px solid",
  dashed: "1px dashed",
  medium: "2px solid",
  mediumDashed: "2px dashed",
  thick: "3px solid",
  double: "3px double",
};

// Dans l'ordre des index de `theme` : Excel inverse clair et foncé par rapport au fichier de thème
const THEME_COLOR_NAMES = [
  "lt1",
  "dk1",
  "lt2",
  "dk2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
];

type NumberFormatter = (numFmt: string, value: number) => string;

type RenderingContext = {
  formatNumber: NumberFormatter;
  themeColors: string[];
};

type CellContext = RenderingContext & {
  span?: MergeSpan;
  border: Partial<Borders> | undefined;
  showsGridLines: boolean;
  hasFilledNeighbour: boolean;
};

type CellContent = string | number | boolean | Date | null;

type SheetColumn = ReturnType<Worksheet["getColumn"]>;

type MergeSpan = {
  rowIndex: number;
  columnIndex: number;
  colSpan: number;
  rowSpan: number;
};

type SpreadsheetColor = {
  argb?: string;
  theme?: number;
  tint?: number;
  indexed?: number;
};

export type SpreadsheetPreviewCell = {
  text: string;
  colSpan: number;
  rowSpan: number;
  style: CSSProperties;
};

export type SpreadsheetPreviewSheet = {
  name: string;
  zoomRatio: number;
  columns: { letter: string; widthPx: number }[];
  rows: {
    number: number;
    heightPt: number | undefined;
    cells: SpreadsheetPreviewCell[];
  }[];
  overflowRowCount: number;
};
