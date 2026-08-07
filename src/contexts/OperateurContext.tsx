"use client";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue } =
  createEntityContext<OperateurApiRead>("Operateur");

export const OperateurProvider = Provider;

export const useOperateurContext = () => {
  const { entity } = useValue();

  return { operateur: entity };
};
