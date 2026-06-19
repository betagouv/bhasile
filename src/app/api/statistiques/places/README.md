# `places`

Périmètre, résolution typologie : [README parent](../README.md). Structures **actives** uniquement.

## Vue globale

Dernière valeur non nulle par structure/champ (millésimes peuvent différer).

| Champ | Calcul |
|-------|--------|
| `totalPlaces` | Somme `placesAutorisees` résolues |
| `population` | Somme `Departement.population` ; `null` si manque |
| `tauxEquipement` | `totalPlaces / population` |
| `pmr`, `lgbt`, `fvvTeh` | Somme dernières valeurs `StructureTypologie` |
| `qpv`, `logementsSociaux` | Dernière `AdresseTypologie` ou repli `Adresse` ; somme |

## `byYear`

Millésime exact, mêmes indicateurs.

## Sources

`StructureTypologie`, `AdresseTypologie` / `Adresse`, `Departement`, `Structure.departementAdministratif`.
