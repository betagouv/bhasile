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

Millésime exact `StructureTypologie` : structures **avec** typologie sur l'année. CPOM par année. Pas de `totalPlaces` (global uniquement).

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif`. `AdresseTypologie` déprécié, non utilisé.
