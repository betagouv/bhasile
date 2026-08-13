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

> **TODO : définition à arbitrer avec le métier.** `byYear.totalStructures` compte les structures ayant un millésime sur l'année exacte, là où la vue globale compte les structures actives « avec ou sans typologie ». Les années récentes décrochent donc dès que la saisie des millésimes est incomplète : la courbe mesure l'avancement de la saisie, pas le parc. Même remarque pour les comptages par type et par bâti, qui ne lisent pourtant pas la typologie (`Structure.type` / adresses).
>
> Pistes étudiées : (1) compter les structures actives et réserver le millésime aux places, (2) reporter le dernier millésime ≤ année, comme déjà fait pour les adresses via `filterByEffectiveVersionAtDate` (cf. [places/README.md](../places/README.md)), (3) arrêter les séries à la dernière année complète.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif`.
