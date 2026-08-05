"use client";

import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { createMutableEntityContext } from "./createEntityContext";

const { Provider, useValue } = createMutableEntityContext<CpomApiRead>("Cpom");

export const CpomProvider = Provider;

export const useCpomContext = () => {
  const { entity, setEntity } = useValue();

  return { cpom: entity, setCpom: setEntity };
};
