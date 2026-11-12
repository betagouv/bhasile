import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "@/constants";

export const isFileTooLarge = (size: number): boolean => size > MAX_FILE_SIZE;

export const FILE_TOO_LARGE_MESSAGE = `Fichier trop volumineux : ${MAX_FILE_SIZE_LABEL} maximum`;
