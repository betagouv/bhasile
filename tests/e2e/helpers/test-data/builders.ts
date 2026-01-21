import { TestStructureData } from "./types";

type TestDataOverrides = {
  dnaCode: string;
  operateurName: string;
};

export const buildTestData = (
  base: TestStructureData,
  { dnaCode, operateurName }: TestDataOverrides
): TestStructureData => ({
  ...base,
  dnaCode,
  identification: {
    ...base.identification,
    operateur: {
      name: operateurName,
      searchTerm: operateurName,
    },
  },
});
