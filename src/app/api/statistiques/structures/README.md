# `structures`

Périmètre, filtres, TODO : [README parent](../README.md).

## Vue globale

| Champ | Calcul |
|-------|--------|
| `totalStructures` | Toutes structures filtrées (y compris sans typologie) |
| `totalCpoms` | CPOM distincts actifs aujourd'hui (`dateStart`/`dateEnd`) liés au périmètre |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif aujourd'hui |
| `structureTypes[]` | Par `Structure.type` — structures actives ; places = somme `placesAutorisees` résolues |
| `structureBatis[]` | Par bâti (`COLLECTIF` défaut) — mêmes règles structures/places |

## `byYear`

Millésime exact `StructureTypologie`. Par année : `totalStructures`, `totalCpoms`, comptes par type (CADA/CPH/HUDA/CAES) et bâti.

## Sources

`Structure.type`, `StructureTypologie`, `Adresse.repartition`, `CpomStructure`.
