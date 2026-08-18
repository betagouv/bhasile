"use client";

import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue } = createEntityContext<CpomApiRead>("Cpom");

export const CpomProvider = Provider;

export const useCpomContext = () => {
  const { entity } = useValue();

  return { cpom: entity };
};
