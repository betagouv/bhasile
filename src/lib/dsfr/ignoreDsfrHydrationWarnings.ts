const HYDRATION_MISMATCH_MESSAGE = "A tree hydrated but some attributes";
const SERVER_LINE = /^-\s/;
const DSFR_SERVER_LINES = [
  /^-\s+data-fr-js-[\w-]+="[^"]*"$/,
  /^-\s+className=""$/,
  /^-\s+style=\{\{--[\w-]+:"[^"]*"(, --[\w-]+:"[^"]*")*\}\}$/,
];

export const ignoreDsfrHydrationWarnings = (): void => {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (isDsfrOnlyHydrationMismatch(args)) {
      return;
    }
    originalConsoleError(...args);
  };
};

const isDsfrOnlyHydrationMismatch = (args: unknown[]): boolean => {
  const [message, , diff] = args;
  if (
    typeof message !== "string" ||
    !message.startsWith(HYDRATION_MISMATCH_MESSAGE) ||
    typeof diff !== "string"
  ) {
    return false;
  }
  const serverLines = diff.split("\n").filter((line) => SERVER_LINE.test(line));
  return serverLines.length > 0 && serverLines.every(isDsfrServerLine);
};

const isDsfrServerLine = (line: string): boolean =>
  DSFR_SERVER_LINES.some((pattern) => pattern.test(line));
