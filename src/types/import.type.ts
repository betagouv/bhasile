export type ImportFile = {
  buffer: Buffer;
  fileName: string;
};

export type ImportError = {
  key: string;
  issues: string[];
};

export type ImportPreview = {
  summary: string;
  details?: string;
  errors: ImportError[];
};

export type ImportResult = {
  summary: string;
};
