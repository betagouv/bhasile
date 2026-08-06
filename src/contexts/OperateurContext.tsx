"use client";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { createMutableEntityContext } from "./createEntityContext";

const { Provider, useValue } =
  createMutableEntityContext<OperateurApiRead>("Operateur");

export const OperateurProvider = Provider;

export const useOperateurContext = () => {
  const { entity, setEntity } = useValue();

  return { operateur: entity, setOperateur: setEntity };
};
