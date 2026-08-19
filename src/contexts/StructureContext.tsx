"use client";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue, useOptionalValue } =
  createEntityContext<StructureApiRead>("Structure");

export const StructureProvider = Provider;

export const useStructureContext = () => {
  const { entity } = useValue();

  return { structure: entity };
};

export const useOptionalStructure = (): StructureApiRead | undefined =>
  useOptionalValue()?.entity;
