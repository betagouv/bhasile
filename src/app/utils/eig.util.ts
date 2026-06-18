/** Motif EIG « comportement violent » (libellé Démarches Numériques). */
const EIG_COMPORTEMENT_VIOLENT_PATTERN = /comportement\s+violent/i;

export const isEigComportementViolent = (type: string): boolean =>
  EIG_COMPORTEMENT_VIOLENT_PATTERN.test(type);
