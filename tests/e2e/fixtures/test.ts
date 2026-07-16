/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` fixture parameter shadows the React hook name. */
import { test as base } from "@playwright/test";

import { StructureType } from "@/types/structure.type";

import {
  createActualisationStructureForTest,
  deleteActualisationCampaign,
  SeededActualisationStructure,
} from "../seed/actualisation.seed";
import {
  deleteCpomById,
  deleteStructureByCode,
  deleteTransformationGraph,
} from "../seed/cleanup";
import { createCpomForTest, SeededCpom } from "../seed/cpom.seed";
import {
  createStructureForTest,
  SeededStructure,
} from "../seed/structure.seed";
import {
  createTransformationSource,
  type SeededTransformationSource,
  seedKnownDnaCodes,
} from "../seed/transformation-source.seed";

export type Fixtures = {
  seededStructure: SeededStructure;
  seededSubventionneeStructure: SeededStructure;
  seededActualisationAutorisee: SeededActualisationStructure;
  seededActualisationSubventionnee: SeededActualisationStructure;
  seededCpom: SeededCpom;
  seededCpomWithDates: SeededCpom;
  structuresPool: SeededStructure[];
  registerTransformation: (transformationId: number) => void;
  knownDnaCodes: string[];
  closingStructure: SeededTransformationSource;
  extendedStructure: SeededTransformationSource;
  contractionSources: SeededTransformationSource[];
  hudaSources: SeededTransformationSource[];
  cadaTarget: SeededTransformationSource;
};

const teardownSource = async (
  source: SeededTransformationSource
): Promise<void> => {
  await deleteStructureByCode(source.codeBhasile).catch(() => {});
};

const useCadaSource = async (
  use: (source: SeededTransformationSource) => Promise<void>
): Promise<void> => {
  const source = await createTransformationSource({
    type: StructureType.CADA,
  });
  try {
    await use(source);
  } finally {
    await teardownSource(source);
  }
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

  seededSubventionneeStructure: async ({}, use) => {
    const structure = await createStructureForTest({
      type: StructureType.HUDA,
    });
    try {
      await use(structure);
    } finally {
      await deleteStructureByCode(structure.codeBhasile).catch(() => {});
    }
  },

  seededActualisationAutorisee: async ({}, use) => {
    const structure = await createActualisationStructureForTest({
      type: StructureType.CADA,
    });
    try {
      await use(structure);
    } finally {
      await deleteActualisationCampaign(structure.campaignId);
      await deleteStructureByCode(structure.codeBhasile).catch(() => {});
    }
  },

  seededActualisationSubventionnee: async ({}, use) => {
    const structure = await createActualisationStructureForTest({
      type: StructureType.HUDA,
    });
    try {
      await use(structure);
    } finally {
      await deleteActualisationCampaign(structure.campaignId);
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

  registerTransformation: async ({}, use) => {
    const transformationIds: number[] = [];
    await use((transformationId: number) => {
      transformationIds.push(transformationId);
    });
    for (const transformationId of transformationIds) {
      await deleteTransformationGraph(transformationId).catch(() => {});
    }
  },

  knownDnaCodes: async ({}, use) => {
    const codes = await seedKnownDnaCodes(2);
    await use(codes);
  },

  closingStructure: async ({}, use) => {
    await useCadaSource(use);
  },

  extendedStructure: async ({}, use) => {
    await useCadaSource(use);
  },

  contractionSources: async ({}, use) => {
    const sources = [
      await createTransformationSource({ type: StructureType.CADA }),
    ];
    try {
      await use(sources);
    } finally {
      await Promise.allSettled(sources.map(teardownSource));
    }
  },

  hudaSources: async ({}, use) => {
    const sources = [
      await createTransformationSource({ type: StructureType.HUDA }),
      await createTransformationSource({ type: StructureType.HUDA }),
    ];
    try {
      await use(sources);
    } finally {
      await Promise.allSettled(sources.map(teardownSource));
    }
  },

  cadaTarget: async ({}, use) => {
    await useCadaSource(use);
  },
});

export { expect } from "@playwright/test";
