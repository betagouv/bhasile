# `structures`

## Typologie (`StructureTypologie`)

| Périmètre                              | Règle                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `totalStructures`                      | Toutes structures filtrées                                                  |
| `structureTypes[]`, `structureBatis[]` | **Structures actives** uniquement = au moins une ligne `StructureTypologie` |

## Vue globale

| Champ                | Calcul                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `totalStructures`    | Toutes structures filtrées                                                                   |
| `totalCpoms`         | CPOM distincts actifs année courante, avec réemploi de `isStructureInCpom`  |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif année courante                                                 |
| `structureTypes[]`   | Par `Structure.type` — structures actives ; places = somme `placesAutorisees` résolues       |
| `structureBatis[]`   | **Structures** : bâti agrégé (`getRepartitionFromRepartitions`). **Places** : somme par `Adresse.repartition` + `Adresse.placesAutorisees` |

### Bâti (`structureBatis[]`)

**Comptage structures** : agrégation structure via `getRepartitionFromRepartitions` (COLLECTIF + DIFFUS → MIXTE).

**Comptage places** : par adresse, selon son `repartition` + `Adresse.placesAutorisees` — évite de basculer toutes les places en MIXTE quand la structure mélange collectif et diffus.

> `AdresseTypologie` en cours de dépréciation : pas utilisé ici pour les places bâti (contrairement à l'onglet places pour QPV / logements sociaux, encore sur typologies adresse le temps de la migration).

- `repartition` absente → COLLECTIF

## `byYear`

Millésime exact `StructureTypologie`. Structures actives = typologie sur l'année. CPOM : `isStructureInCpom` par année.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif` (convention CPOM).
