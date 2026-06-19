# `controleQualite`

## Sources

- EIG : `EvenementIndesirableGrave` via `dnaCode`
- Évaluations : `Evaluation` par `structureId`
- Violent : sous-chaîne `comportement violent` (insensible à la casse, espaces normalisés) — `isEigComportementViolent`

## Vue globale `eig` (12 mois glissants)

| Champ                                                             | Calcul                                  |
| ----------------------------------------------------------------- | --------------------------------------- |
| `tauxEig`                                                         | `nbEig / places autorisées`             |
| `nbEig`, `nbEigComportementViolent`, `tauxEigComportementViolent` | Comptages / ratios                      |
| `moyenneEvaluationsCurrentYear`                                   | Moyenne ou médiane notes `CURRENT_YEAR` |

## `byMonth` / `byTrimester` / `byYear`

Recalcul sur **toutes** données période - pas d'agrégation front.

Clés : `date` (mois), `year`+`trimester`, `year`.

Indicateurs : déclarations EIG manquantes, comptes EIG, notes évaluations (moyenne/médiane globale période).
