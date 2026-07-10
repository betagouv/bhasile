# `structures`

## Vue globale

Toutes les répartitions portent sur les structures ouvertes à la date de référence (`context.structures`). Trois dénominateurs sont exposés, chacun cohérent avec le camembert qu'il sert (parts à 100 %) :

| Champ                | Calcul                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `totalStructures`    | Structures ouvertes à la date de référence : dénominateur des comptages `structures`                                                                                                                                                                               |
| `totalPlaces`        | Places **autorisées** : somme de la dernière typologie par structure (`computeTotalPlaces`) = somme `structureTypes[].places`                                                                                                                                      |
| `totalPlacesAdresse` | Places **à l'adresse** (dernière version) = somme `structureBatis[].places` — dénominateur des ratios bâti × places                                                                                                                                                |
| `totalCpoms`         | CPOM distincts actifs **à date** (au jour près) sur les structures ouvertes à la date de référence                                                                                                                                                                 |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif **à date** (au jour près)                                                                                                                                                                                                            |
| `structureTypes[]`   | Par `Structure.type` scalaire — **toutes** les structures actives (type toujours présent → Σ structures = `totalStructures`) ; places = typologie (0 sans millésime)                                                                                               |
| `structureBatis[]`   | **Structures** : bâti agrégé de la dernière version (`getRepartitionFromRepartitions`, COLLECTIF+DIFFUS → MIXTE) ; une structure sans adresse répartie est **hors camembert** (pas de défaut). **Places** : par `Adresse.repartition` + `Adresse.placesAutorisees` |

Les quatre camemberts du front somment à 100 % de leur dénominateur, sauf **bâti × structures** qui peut être < 100 % si des structures actives n'ont aucune adresse répartie sur leur version courante (en théorie toutes en ont une).

> `AdresseTypologie` en cours de dépréciation : non utilisé dans les stats (voir onglet `places`).

- Adresse sans `repartition` -> places comptées en COLLECTIF ; structure sans aucune adresse répartie -> exclue du comptage bâti

## `byYear`

Millésime exact `StructureTypologie`. `totalStructures` = structures actives **avec** typologie sur l'année. CPOM : `isStructureInCpom` par année. Pas de `totalPlaces` par année (retiré) : le total des places est un indicateur global. Comptage bâti aligné sur le global : une structure sans adresse répartie est hors des catégories (pas de défaut COLLECTIF).

## TODO (à valider)

Une structure avec des adresses en `Diffus` et en `Collectif` compte comme `Mixte` dans `structureBatis[].structures` (mais ses places sont bien ventilées par bâti réel de chaque adresse, pas de places "Mixte"). À confirmer avec le métier que cette convention (comptage structure agrégé vs comptage places par adresse) est bien celle attendue.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif` (convention CPOM).
