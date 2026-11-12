export type ImportFile = {
  buffer: Buffer;
  fileName: string;
  month: string | null;
};

export type ImportError = {
  key: string;
  issues: string[];
};

export type ImportPreview = {
  summary: string;
  changes: string[];
  detectedMonth?: string | null;
  errors: ImportError[];
};

export type ImportResult = {
  summary: string;
};
