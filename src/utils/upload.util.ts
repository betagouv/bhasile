import { formatBytes } from "@/app/utils/number.util";
import { MAX_FILE_SIZE } from "@/constants";

export const isFileTooLarge = (size: number): boolean => size > MAX_FILE_SIZE;

export const getFileTooLargeMessage = (size: number): string =>
  `Fichier trop volumineux : ${formatBytes(size)}, pour ${formatBytes(MAX_FILE_SIZE)} maximum`;
