# Les deux départements d'une structure

Deux colonnes portent un département administratif. Elles ne sont pas redondantes :
elles répondent à deux questions différentes.

| Colonne                                     | Question                                                    | Nullable |
| ------------------------------------------- | ----------------------------------------------------------- | -------- |
| `Structure.departementAdministratif`        | À quel département cette structure est-elle **rattachée** ? | non      |
| `StructureVersion.departementAdministratif` | Que dit **cette version** de l'adresse administrative ?     | oui      |

## ⚖️ La règle

- **Autorisation et filtrage : `Structure`.** C'est la clé qui décide quel agent peut lire
  et écrire quelle structure. Elle est immuable, jamais nulle, et posée par le serveur.
- **Affichage : `StructureVersion`.** C'est ce que la version courante déclare, affiché à
  côté de la commune de cette même version.

Conséquence assumée : une version sans département affiche `Avranches` au lieu de
`Avranches (50)`, alors que la ligne reste bien dans le périmètre de l'agent. C'est
volontaire : un département manquant sur une version est une anomalie de données.

## 🔒 Pourquoi elles ne peuvent pas se contredire

`checkNoDepartementAdministratifChange` ([structure-version.util.ts](../src/app/api/structure-versions/structure-version.util.ts))
rejette toute écriture qui donnerait à une version un département différent de celui de sa
structure. Les deux valeurs sont donc **égales ou l'une est nulle** — jamais divergentes.
C'est ce qui rend l'ordre de lecture sans conséquence sur des données saines, et c'est
pourquoi le sujet ressort à chaque fois : la différence ne se voit que sur les trous.

## 🐣 Le cas des blocs CREATION

Une transformation crée ses `StructureVersion` dès la sélection, avant que l'opérateur
n'ait saisi l'adresse et un bloc `CREATION` n'a pas encore de `Structure`. Pendant cette
fenêtre, seule la version porte un département, et il peut être nul.

C'est la raison d'être de `getStructureVersionDepartement`
([transformation.util.ts](../src/app/utils/transformation.util.ts)) : la structure fait foi,
la version ne répond que lorsqu'il n'y a pas encore de structure.

```ts
structureVersion?.structure?.departementAdministratif ??
  structureVersion?.departementAdministratif;
```

Cet helper sert l'**autorisation** (`checkCanUpdateDepartements`, `getTransformationDepartement`)
et les écrans du parcours transformation où le département conditionne l'affichage d'une
carte — pas le libellé des listes, qui lit la version directement.

## 🗺️ Où la règle s'applique

| Endroit                                        | Lit                                             |
| ---------------------------------------------- | ----------------------------------------------- |
| Blocs du tableau de bord — filtre et périmètre | `Structure` (via `isStructureInDashboardScope`) |
| Blocs du tableau de bord — libellé affiché     | version courante                                |
| Liste `/structures`                            | version courante                                |
| CASL sur `PUT /api/structures/[id]`            | `Structure` (via `getStructureDepartement`)     |
| Transformations — autorisation                 | `getStructureVersionDepartement`                |
| Vues `reporting.*`                             | `Structure`                                     |

## ⚠️ Pièges connus

- `mergeStructureWithVersion` écrase le scalaire de la structure par celui de la version :
  `departementAdministratif` figure dans `VERSIONED_FIELD_KEYS`. Tout ce qui lit un objet
  fusionné lit donc la **version**, même si le champ porte le nom de la structure.
- `copyStructureVersion` applique `...overrides` en dernier : une valeur envoyée par le
  client écrase celle récupérée en base. Le garde ci-dessus la rattrape à l'écriture, mais
  ne jamais s'appuyer sur cette valeur pour une décision d'autorisation.
