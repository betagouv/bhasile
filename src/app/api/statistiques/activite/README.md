# `activite`

Liée à la structure par ses codes DNA liées (`DnaStructure`).

## TODO

Les dénominateurs de taux diffèrent selon les scopes (toutes structures vs hors CAES vs hors CAES+CPH) alors que `placesEnregistreesDna` agrège tout : à garder en tête pour l'interprétation des seuils agrégés.

## Scopes

| Indicateur              | Structures                                       |
| ----------------------- | ------------------------------------------------ |
| `placesEnregistreesDna` | Toutes                                           |
| Indisponibilités        | Toutes sauf CAES                                 |
| Présences indues        | Toutes sauf CAES et CPH (en pratique CADA, HUDA) |

`dnaCode` dans scope si ≥1 structure liée a le bon type.

## `byMonth`

| Champ                                        | Calcul                                             |
| -------------------------------------------- | -------------------------------------------------- |
| `placesEnregistreesDna`                      | Somme `placesAutorisees`                           |
| `placesIndisponibles`, `tauxIndisponibilite` | Scope hors CAES                                    |
| `presencesIndues*`, `tauxPresencesIndues*`   | Scope hors CAES et CPH ; `Total` = BPI + déboutées |

Taux = ratio 0–1, `null` si dénominateur nul.

## Source

`Activite` - 1 ligne / `dnaCode` / mois.
