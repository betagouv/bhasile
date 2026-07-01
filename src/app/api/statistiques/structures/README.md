# `structures`

## Typologie (`StructureTypologie`)

| Périmètre                              | Règle                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| `totalStructures`                      | Structures ouvertes à la date de référence (`context.structures`) |
| `structureTypes[]`, `structureBatis[]` | Structures actives **avec** typologie (>=1 `StructureTypologie`)  |

## Vue globale

| Champ                | Calcul                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `totalStructures`    | Structures ouvertes à la date de référence (`context.structures`)                                                                          |
| `totalCpoms`         | CPOM distincts actifs **à date** (au jour près) sur les structures ouvertes à la date de référence                                         |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif **à date** (au jour près)                                                                                    |
| `structureTypes[]`   | Par `Structure.type` - structures actives ; places = somme `placesAutorisees` résolues                                                     |
| `structureBatis[]`   | **Structures** : bâti agrégé (`getRepartitionFromRepartitions`). **Places** : somme par `Adresse.repartition` + `Adresse.placesAutorisees` |

### Bâti (`structureBatis[]`)

**Comptage structures** : agrégation structure via `getRepartitionFromRepartitions` (COLLECTIF + DIFFUS -> MIXTE).

**Comptage places** : par adresse, selon son `repartition` + `Adresse.placesAutorisees`.

> `AdresseTypologie` en cours de dépréciation : non utilisé dans les stats (voir onglet `places`).

- `repartition` absente -> COLLECTIF

## `byYear`

Millésime exact `StructureTypologie`. `totalStructures` = structures actives **avec** typologie sur l'année. CPOM : `isStructureInCpom` par année.

## TODO (à valider)

Une structure avec des adresses en `Diffus` et en `Collectif` compte comme `Mixte` dans `structureBatis[].structures` (mais ses places sont bien ventilées par bâti réel de chaque adresse, pas de places "Mixte"). À confirmer avec le métier que cette convention (comptage structure agrégé vs comptage places par adresse) est bien celle attendue.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif` (convention CPOM).
