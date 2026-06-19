# `structures`

## TODO post Transfo

- Filtrer les places sur les `Adresses` liées à la dernière `StructureVersion` déjà écoulée

## Typologie (`StructureTypologie`)

| Périmètre                              | Règle                                                            |
| -------------------------------------- | ---------------------------------------------------------------- |
| `totalStructures`                      | Structures actives (`filterStructuresActives`)                   |
| `structureTypes[]`, `structureBatis[]` | Structures actives **avec** typologie (>=1 `StructureTypologie`) |

## Vue globale

| Champ                | Calcul                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `totalStructures`    | Structures actives (`filterStructuresActives`)                                                                                             |
| `totalCpoms`         | CPOM distincts actifs année courante, avec réemploi de `isStructureInCpom`                                                                 |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif année courante                                                                                               |
| `structureTypes[]`   | Par `Structure.type` - structures actives ; places = somme `placesAutorisees` résolues                                                     |
| `structureBatis[]`   | **Structures** : bâti agrégé (`getRepartitionFromRepartitions`). **Places** : somme par `Adresse.repartition` + `Adresse.placesAutorisees` |

### Bâti (`structureBatis[]`)

**Comptage structures** : agrégation structure via `getRepartitionFromRepartitions` (COLLECTIF + DIFFUS → MIXTE).

**Comptage places** : par adresse, selon son `repartition` + `Adresse.placesAutorisees`.

> `AdresseTypologie` en cours de dépréciation : non utilisé dans les stats (voir onglet `places`).

- `repartition` absente → COLLECTIF

## `byYear`

Millésime exact `StructureTypologie`. `totalStructures` = structures actives **avec** typologie sur l'année. CPOM : `isStructureInCpom` par année.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif` (convention CPOM).
