"use client";

import { createContext, useContext } from "react";

export const ExportContext = createContext<boolean>(false);

export const useExportContext = () => useContext(ExportContext);
