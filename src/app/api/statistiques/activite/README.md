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

| Indicateur                | Structures              |
| ------------------------- | ----------------------- |
| `placesEnregistreesDna`   | Toutes                  |
| Indisponibilités + motifs | Toutes sauf CAES        |
| Présences indues          | Toutes sauf CAES et CPH |

Taux = ratio 0-1, `null` si dénominateur nul.

## TODO (à valider)

Les taux d'indispo / présences indues utilisent des dénominateurs filtrés par type (hors CAES ; hors CAES+CPH) alors que `placesEnregistreesDna` et `placesDisponibles` agrègent toutes les structures. À garder en tête pour les seuils agrégés et le camembert.
