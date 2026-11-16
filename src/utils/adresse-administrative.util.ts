export const withoutAdresseAdministrativeHorsPerimetre = <
  T extends { departementAdministratif?: string },
>(
  values: T,
  canUpdateDepartement: (departementAdministratif: string) => boolean
): T => {
  if (
    !values.departementAdministratif ||
    canUpdateDepartement(values.departementAdministratif)
  ) {
    return values;
  }
  return {
    ...values,
    adresseAdministrativeComplete: undefined,
    adresseAdministrative: undefined,
    codePostalAdministratif: undefined,
    communeAdministrative: undefined,
    departementAdministratif: undefined,
  };
};
