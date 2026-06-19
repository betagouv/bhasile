/** Motif EIG « comportement violent » (libellé Démarches Numériques). */
export const isEigComportementViolent = (type: string): boolean =>
  type.toLowerCase().includes("comportement violent");
