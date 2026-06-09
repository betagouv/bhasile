import { v4 as uuidv4 } from "uuid";

const PREFIX = "E2E-";

const shortId = (): string =>
  uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();

export const uniqueCodeBhasile = (): string => `${PREFIX}${shortId()}`;

export const uniqueCpomName = (suffix = ""): string =>
  `${PREFIX}CPOM-${shortId()}${suffix ? `-${suffix}` : ""}`;

export const uniqueDnaCode = (): string => `${PREFIX}DNA-${shortId()}`;

export const uniqueFinessCode = (): string => `${PREFIX}FIN-${shortId()}`;

export const E2E_PREFIX = PREFIX;
