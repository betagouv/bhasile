# `rmu`

Référés Mesures Utiles. **Donnée au département** (`Rmu.departementNumero`), pas à la structure : ni résolution DNA, ni pivot `StructureVersion`, ni structure active : on somme les lignes `Rmu` du périmètre.

Source : table `Rmu`, une ligne par département × mois, alimentée par `scripts/recurring-scripts/rmu-fill.ts`.

## Indicateurs

La table a d'autres champs (`deboutesSansMesureAdministrative`, `misesEnDemeure`), non exposés en front.

| Champ             | Calcul                                                   |
| ----------------- | -------------------------------------------------------- |
| `referesEngages`  | Somme sur la période                                     |
| `referesExecutes` | Somme sur la période                                     |
| `tauxExecute`     | `referesExecutes / referesEngages` |

## Périmètre

Ne suit **que** `departements` (`null` = tout le parc). Dès qu'un filtre `operateurs`/`types` est actif, le bloc vaut **`null`** : une donnée départementale ne se différencie pas par structure.

## `byMonth` / `byTrimester` / `byYear`

Comme `activite`/`controleQualite` : somme des valeurs déclarées, sans inférence (une période sans ligne n'apparaît pas), taux recalculés en back sur les totaux de la période (jamais une moyenne de taux mensuels). Clé de période : `date`.

