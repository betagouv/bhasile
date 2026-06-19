# `activite`

Périmètre : [README parent](../README.md). `Activite` via `dnaCode` → `DnaStructure`.

## Scopes

| Indicateur | Structures |
|------------|------------|
| `placesEnregistreesDna` | Toutes |
| Indisponibilités | Toutes sauf CAES |
| Présences indues | CAES + CPH |

`dnaCode` dans scope si ≥1 structure liée a le bon type.

## `byMonth`

| Champ | Calcul |
|-------|--------|
| `placesEnregistreesDna` | Somme `placesAutorisees` |
| `placesIndisponibles`, `tauxIndisponibilite` | Scope hors CAES |
| `presencesIndues*`, `tauxPresencesIndues*` | Scope CAES+CPH ; `Total` = BPI + déboutées |

Taux = ratio 0–1, `null` si dénominateur nul.

## Source

`Activite` — 1 ligne / `dnaCode` / mois.
