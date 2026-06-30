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
| `qpv`, `logementsSociaux` | Somme `Adresse.qpv` / `Adresse.logementSocial`           |

## `byYear`

Millésime exact sur `StructureTypologie` (`totalPlaces`, `pmr`, etc.).
`qpv` / `logementsSociaux` : valeurs courantes `Adresse` (pas de millésime adresse).

## TODO (à valider)

En `byYear`, `qpv` et `logementsSociaux` restent les valeurs courantes `Adresse` : pas de millésime adresse ni reconstitution par transfo de l'année.

## Sources

`StructureTypologie`, `Adresse`, `Departement`, `Structure.departementAdministratif`.
