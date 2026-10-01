# `structures`

Structures ouvertes à la date de référence (`context.structures`).

## Vue globale

| Champ                | Contenu                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `totalStructures`    | Nombre de structures ouvertes                                           |
| `totalPlaces`        | Places autorisées (typologie) = Σ `structureTypes[].places`             |
| `totalPlacesAdresse` | Places à l'adresse (dernière version) = somme `structureBatis[].places` |
| `totalCpoms`         | CPOM distincts actifs à date                                            |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif à date                                    |
| `structureTypes[]`   | Comptage par `Structure.type` (toutes) ; places = typologie             |
| `structureBatis[]`   | Comptage par bâti de la dernière version ; places par adresse           |

Bâti : COLLECTIF + DIFFUS -> MIXTE. Sans adresse répartie -> hors comptage bâti. Chaque camembert somme à 100 % de son total, sauf bâti × structures (structures sans adresse exclues).

## `byYear`

Structures comptabilisées sur l'année (cf. [README racine](../README.md#structures-comptabilisées-par-année)) **avec** un millésime exact `StructureTypologie`. CPOM par année. `completude` porte le score de l'année, `null` sur une année d'initialisation.

| Champ                                   | Contenu                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `totalStructures`, `structures<Type>`   | Comptages de l'année                                                        |
| `structuresBati<Bati>`                  | Comptage par bâti (adresses de la version courante, comme la vue globale)   |
| `structureTypes[]`, `structureBatis[]`  | Même forme que la vue globale, pour les camemberts « en <année> » : structures et places par type (places = millésime de l'année) et par bâti (places par adresse courante) |

Sur une année de campagne, seules les structures actualisées sont comptées, y compris pour le type et le bâti que le formulaire ne demande pas : choix d'une assiette commune, détaillé dans le README racine.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif`.
