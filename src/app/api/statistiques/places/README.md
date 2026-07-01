# `places`

> `AdresseTypologie` en cours de dépréciation : QPV et logements sociaux lus directement sur `Adresse`.

## Vue globale

Structures actives avec typologie. Dernière valeur non nulle par structure/champ (millésimes peuvent différer) pour `StructureTypologie`.

| Champ                     | Calcul                                                   |
| ------------------------- | -------------------------------------------------------- |
| `totalPlaces`             | Somme `placesAutorisees` résolues (`StructureTypologie`) |
| `population`              | Somme `Departement.population` ; `null` si manque        |
| `tauxEquipement`          | `totalPlaces / population` (ratio 0-1, `roundStatsRate`) |
| `pmr`, `lgbt`, `fvvTeh`   | Somme dernières valeurs `StructureTypologie`             |
| `qpv`, `logementsSociaux` | Somme `Adresse.qpv` / `Adresse.logementSocial` de la version effective à date |

## `byYear`

Millésime exact sur `StructureTypologie` (`totalPlaces`, `pmr`, etc.).
`qpv` / `logementsSociaux` : `Adresse` n'a pas de millésime propre, mais est rattachée à une `StructureVersion` datée. Pour chaque année, on résout la `StructureVersion` effective de la structure au 31/12 de cette année-là (report de la dernière version connue tant qu'aucune nouvelle n'est effective, plafonné à aujourd'hui pour l'année en cours) via `filterByEffectiveVersionAtDate`, puis on somme les `Adresse` rattachées à cette version.

## TODO (à valider)

Par année, `qpv`/`logementsSociaux` sont non millésimés : on prend "la dernière version de la structure à date" en inférant pour les années suivantes tant qu'aucune nouvelle version n'existe. Exemple : versions 02/2024, 05/2024 et 05/2026 -> on retient la 05/2024 pour 2024 et 2025, et la 05/2026 pour 2026. À valider avec le métier que cette interprétation (dernière version connue, avec report) est bien celle attendue.

## Sources

`StructureTypologie`, `Adresse`, `StructureVersion` (historique complet), `Departement`, `Structure.departementAdministratif`.
