# `controleQualite`

Structures actives avec typologie (≥1 `StructureTypologie`). Places EIG = somme `placesAutorisees` résolues.

## Sources

- EIG : `EvenementIndesirableGrave` via `dnaCode`
- Évaluations : `Evaluation` par `structureId`
- Violent : sous-chaîne `comportement violent` (insensible à la casse, espaces normalisés) - `isEigComportementViolent`

## Vue globale `eig` (12 mois glissants)

| Champ                                                             | Calcul                                  |
| ----------------------------------------------------------------- | --------------------------------------- |
| `tauxEig`                                                         | `nbEig / places autorisées`             |
| `nbEig`, `nbEigComportementViolent`, `tauxEigComportementViolent` | Comptages / ratios                      |
| `moyenneEvaluationsCurrentYear`                                   | Moyenne ou médiane notes `CURRENT_YEAR` |

## `byMonth` / `byTrimester` / `byYear`

Recalcul sur **toutes** données période - pas d'agrégation front.

Clés : `date` (mois), `year`+`trimester`, `year`.

**Périmètre structures** : lookup dans `activeStructureIdsByPeriod` (index racine, construit dans `buildStatistiquesContext`). Ex. fermée le 05/05 → compte jan–mai, pas juin.

Indicateurs : déclarations EIG manquantes, comptes EIG, notes évaluations (moyenne/médiane globale période).
