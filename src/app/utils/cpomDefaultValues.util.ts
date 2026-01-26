export const getCpomDefaultValues = (cpom: CpomApiType): CpomIdentificationFormValues => {
  return {
    id: cpom.id,
    name: cpom.name,
    yearStart: cpom.yearStart ?? undefined,
    yearEnd: cpom.yearEnd ?? undefined,
  };
};