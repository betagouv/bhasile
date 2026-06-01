/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` fixture parameter shadows the React hook name. */
import { test as base } from "@playwright/test";

import { deleteCpomById, deleteStructureByCode } from "../seed/cleanup";
import { createCpomForTest, SeededCpom } from "../seed/cpom.seed";
import {
  createStructureForTest,
  SeededStructure,
} from "../seed/structure.seed";

export type Fixtures = {
  seededStructure: SeededStructure;
  seededCpom: SeededCpom;
  seededCpomWithDates: SeededCpom;
  structuresPool: SeededStructure[];
};

export const test = base.extend<Fixtures>({
  seededStructure: async ({}, use) => {
    const structure = await createStructureForTest();
    try {
      await use(structure);
    } finally {
      await deleteStructureByCode(structure.codeBhasile).catch(() => {});
    }
  },

  seededCpom: async ({}, use) => {
    const cpom = await createCpomForTest();
    try {
      await use(cpom);
    } finally {
      await deleteCpomById(cpom.id).catch(() => {});
    }
  },

  seededCpomWithDates: async ({}, use) => {
    const cpom = await createCpomForTest({
      acteConvention: { startDate: "2024-01-01", endDate: "2026-12-31" },
    });
    try {
      await use(cpom);
    } finally {
      await deleteCpomById(cpom.id).catch(() => {});
    }
  },

  structuresPool: async ({}, use) => {
    const created = await Promise.all([
      createStructureForTest(),
      createStructureForTest(),
      createStructureForTest(),
    ]);
    try {
      await use(created);
    } finally {
      await Promise.allSettled(
        created.map((structure) => deleteStructureByCode(structure.codeBhasile))
      );
    }
  },
});

export { expect } from "@playwright/test";
