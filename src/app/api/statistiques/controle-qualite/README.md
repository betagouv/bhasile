# `controleQualite`

Structures actives avec typologie (≥1 `StructureTypologie`). Places EIG = somme `placesAutorisees` résolues.

## Sources

- EIG : `EvenementIndesirableGrave` via `dnaCode`, restreints de 2015 à `CURRENT_YEAR`
- Évaluations : `Evaluation` par `structureId`
- Lien DNA : `lookupStructureIdsForDnaAtDate` (`statistiques.util`) - version effective à la date de l'événement (`structureVersionTimeline`)
- Violent : sous-chaîne `comportement violent` (insensible à la casse, espaces normalisés) - `isEigComportementViolent`

## Vue globale `eig` (12 mois glissants)

Fenêtre : du 1er jour du mois d'il y a 12 mois à aujourd'hui (`getTwelveMonthWindow`).

Une structure compte **au numérateur et au dénominateur tant qu'elle est ouverte**, pas au-delà :

- **EIG** : ceux dont le DNA résout, à la date de l'événement, vers une structure du périmètre alors ouverte (même règle que les séries par période).
- **Places** : places de chaque structure pondérées par sa durée d'ouverture sur la fenêtre. Une structure fermée il y a 5 mois pèse 7/12 de ses places, avec ses EIG des 7 premiers mois.
- **Évaluations** : celles menées pendant que la structure était ouverte.

Les places sont les dernières places connues de la structure : pas d'historique de capacité sur la fenêtre, pour rester simple.

| Champ                                                                        | Calcul                           |
| ---------------------------------------------------------------------------- | -------------------------------- |
| `tauxEig`, `nbEig`, `nbEigComportementViolent`, `tauxEigComportementViolent` | `computeEigRates`                |
| `moyenneEvaluationsLast12Months`                                             | `computeEvaluationGlobalSummary` |

## `byMonth` / `byTrimester` / `byYear`

Recalcul sur **toutes** données période - pas d'agrégation front.

Clés de période : `date` (1er jour du mois, du trimestre ou de l'année).

TODO : confirmer métier - ce format unifié plutôt que `year` + `trimester` (ou `year` + `month`) en champs séparés.

**Périmètre structures** : lookup dans `activeStructureIdsByPeriod` (index racine, construit dans `buildStatistiquesContext`). Ex. fermée le 05/05 -> compte jan-mai, pas juin.

Indicateurs : déclarations EIG manquantes, comptes EIG, notes évaluations (moyenne/médiane globale période).
