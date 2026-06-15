export class StatistiquesPerimetreVideError extends Error {
  constructor() {
    super("Aucune structure ne correspond aux filtres sélectionnés.");
    this.name = "StatistiquesPerimetreVideError";
  }
}
