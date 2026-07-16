# `controleQualite`

Structures actives avec typologie (≥1 `StructureTypologie`). Places EIG = somme `placesAutorisees` résolues.

## Sources

- EIG : `EvenementIndesirableGrave` via `dnaCode`, restreints de 2015 à `CURRENT_YEAR`
- Évaluations : `Evaluation` par `structureId`
- Lien DNA : `lookupStructureIdsForDnaAtDate` (`statistiques.utils`) - version effective à la date de l'événement (`structureVersionTimeline`)
- Violent : sous-chaîne `comportement violent` (insensible à la casse, espaces normalisés) - `isEigComportementViolent`

## Vue globale `eig` (12 mois glissants)

Fenêtre 12 mois : `filterByTwelveMonthWindow` (`statistiques.utils`).

| Champ                                                                        | Calcul                           |
| ---------------------------------------------------------------------------- | -------------------------------- |
| `tauxEig`, `nbEig`, `nbEigComportementViolent`, `tauxEigComportementViolent` | `computeEigRates`                |
| `moyenneEvaluationsCurrentYear`                                              | `computeEvaluationGlobalSummary` |

## TODO (métier)

Confirmer que `moyenneEvaluationsCurrentYear` doit bien être sur **12 mois glissants** (comme les EIG) et non sur l'année civile en cours (ex. 2026). À date, même jour - 1 an dans les deux cas.

## `byMonth` / `byTrimester` / `byYear`

Recalcul sur **toutes** données période - pas d'agrégation front.

Clés de période : `date` (1er jour du mois, du trimestre ou de l'année).

TODO : confirmer métier - ce format unifié plutôt que `year` + `trimester` (ou `year` + `month`) en champs séparés.

**Périmètre structures** : lookup dans `activeStructureIdsByPeriod` (index racine, construit dans `buildStatistiquesContext`). Ex. fermée le 05/05 -> compte jan-mai, pas juin.

Indicateurs : déclarations EIG manquantes, comptes EIG, notes évaluations (moyenne/médiane globale période).
