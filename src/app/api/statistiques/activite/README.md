# `activite`

Liée à la structure par ses codes DNA liées (`DnaStructure`).

## TODO

Du coup si les places enregistrées DNA sont remontées pour tous les types de structure, mais les indisponibles pour toutes sauf les CAES et les indues toutes sauf CAES et CPH, est-ce qu'on ne va pas fausser les seuils en agrégeant (si mais que faire)

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
