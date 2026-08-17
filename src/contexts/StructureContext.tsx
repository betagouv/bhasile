"use client";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { createMutableEntityContext } from "./createEntityContext";

const { Provider, useValue, useOptionalValue } =
  createMutableEntityContext<StructureApiRead>("Structure");

export const StructureProvider = Provider;

export const useStructureContext = () => {
  const { entity, setEntity } = useValue();

  return { structure: entity, setStructure: setEntity };
};

export const useOptionalStructure = (): StructureApiRead | undefined =>
  useOptionalValue()?.entity;
