/** Motif EIG « comportement violent » (libellé Démarche Numérique). */
export const isEigComportementViolent = (type: string): boolean =>
  type.toLowerCase().includes("comportement violent");
