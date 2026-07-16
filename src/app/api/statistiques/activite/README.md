# `activite`

Deux vues distinctes

## `summary` - camembert + motifs

Pour chaque structure **ouverte à la date de référence** (`context.structures`) :

1. Résoudre le DNA à la date de l'activité (`lookupStructureIdsForDnaAtDate`)
2. Prendre la **dernière** activité connue pour cette structure
3. Sommer les indicateurs (places, motifs, présences indues)

Une structure sans activité n'entre pas dans les totaux.

## `byMonth` - tableau mensuel

Somme des activités **effectivement déclarées** pour chaque mois.

- Pas d'inférence : si une structure ouverte n'a pas d'activité pour un mois donné, elle ne compte pas dans ce mois
- Les taux sont calculés sur les dénominateurs du mois (scopes type identiques à `summary`)

## Scopes type

| Indicateur                                     | Structures              |
| ---------------------------------------------- | ----------------------- |
| `placesEnregistreesDna`                        | Toutes                  |
| Indisponibilités + motifs, `placesDisponibles` | Toutes sauf CAES        |
| Présences indues                               | Toutes sauf CAES et CPH |

Taux = ratio 0-1, `null` si dénominateur nul.

## Taux et dénominateurs iso-périmètre

**Tous les taux sont calculés en back** : le front consomme uniquement les `taux*` (ratios 0-1), pas de dénominateur brut dans la réponse. Chaque taux divise le numérateur par un dénominateur restreint aux **mêmes types** que lui (calculé en interne dans `ActiviteTotals`, non exposé) :

| Taux                                     | Numérateur / dénominateur                        | Périmètre               |
| ---------------------------------------- | ------------------------------------------------ | ----------------------- |
| `tauxIndisponibilite`                    | indisponibles / enregistrées hors CAES           | Toutes sauf CAES        |
| `tauxPresencesInduesBPI/Deboutees/Total` | présences indues / enregistrées hors CAES et CPH | Toutes sauf CAES et CPH |

Les seuils cibles (indispo 3 %, BPI 3 %, déboutées 4 %, total 7 %) sont consommables côté front via la constante définie ici : `stats/_components/activite/activite.constants.ts` (`ACTIVITE_SEUILS_CIBLES`).
