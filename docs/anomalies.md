# Anomalies

Détection des incohérences de données d'une structure. Remplace les vues `reporting.structures_*_quality`.

## Principe

Une seule implémentation des règles, en TypeScript, dans `src/lib/anomalies/`. Elle est **pure et isomorphe** : pas d'accès base, pas d'horloge, pas de modèle Prisma en entrée. Trois consommateurs :

| Consommateur               | Appel                                    | Fraîcheur                   |
| -------------------------- | ---------------------------------------- | --------------------------- |
| Fiche structure            | calcul à la lecture                      | toujours à jour             |
| Formulaire                 | calcul sur les valeurs `react-hook-form` | temps réel                  |
| Tableau de bord / Metabase | lecture de la table `Anomalie`           | recalcul complet périodique |

La table sert d'index pour les requêtes transverses et porte les annotations humaines. Elle n'est jamais la source de vérité des règles.

## Modèle

Clé naturelle : `[structureId, code, year, targetId]`.

| Colonne                         | Sémantique                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`                          | Identifie la règle. Enum Prisma, dupliqué en TS dans `src/types/anomalie.type.ts` (test de garde : `tests/lib/anomalies/anomalie.definition.test.ts`) |
| `year`                          | **Exercice** concerné. `0` = anomalie non rattachée à un exercice. Jamais utilisé pour discriminer autre chose                                        |
| `targetId`                      | Ligne fautive. `0` = anomalie portée par la structure. La table pointée est donnée par `cible` dans le registre, jamais stockée en base               |
| `isJustified`                   | `null` jamais examinée, `true` justifiée, `false` rouverte                                                                                            |
| `justifiedById` / `justifiedAt` | Traçabilité, nécessaire à la réouverture                                                                                                              |

Une anomalie qui disparaît est supprimée : le commentaire est perdu, c'est assumé. Une justification n'est pas invalidée automatiquement si la donnée change sans faire disparaître l'anomalie — `justifiedAt` est affiché pour que l'agent le repère.

Il n'existe **aucune table de définitions** : les libellés et catégories vivent uniquement en TS. La vue de reporting n'expose donc que le `code`, à charge de Metabase d'en faire la lecture.

## Registre

`src/lib/anomalies/anomalie.definition.ts` — un `Record<AnomalieCode, AnomalieDefinition>` exhaustif : `label`, `categorie`, `cible`, `champsCibles` (surlignage front), `isDisplayed`.

Les 34 règles sont **toutes calculées et persistées**. `isDisplayed` ne gouverne que l'affichage front : exposer une règle supplémentaire aux agents est un changement de booléen.

Une anomalie est rattachée à un exercice **dès que la donnée sous-jacente l'est**. Les agrégats `BOOL_OR` / `MIN` / `MAX` des vues `004*` ont donc tous été désagrégés par année, à deux exceptions près, notées en commentaire dans le code : les indicateurs LGBT / FVV-TEH (portés par la version courante, pas par un millésime) et les activités (le contexte ne contient que le dernier millésime par code DNA).

## Moteur

`computeAnomalies(contexte, { anneeCourante })` → `{ detectees, codesEvalues }`.

Toutes les tranches de `AnomalieContexte` sont optionnelles. Une règle déclare celles dont elle a besoin dans `requiert` et n'est évaluée que si elles sont **toutes** présentes — ce qui permet au formulaire de n'en fournir qu'une partie. Dans `evalue`, elles sont typées non-optionnelles.

Le formulaire construit son contexte en écrasant la seule tranche en cours d'édition :

```ts
computeAnomalies(
  { ...contexteServeur, typologies: watch("typologies") },
  { anneeCourante }
);
```

## Réconciliation

⚠️ La suppression doit être **restreinte à `codesEvalues`**. Une règle non évaluée faute de données est indiscernable d'une règle évaluée sans anomalie : un `deleteMany` sur toute la structure détruirait des anomalies légitimes et les justifications associées.

1. `upsert` de chaque détection sur la clé naturelle (préserve `commentaire` et `isJustified`)
2. `deleteMany` des anomalies dont le `code` est dans `codesEvalues` et qui ne sont pas redétectées

## Ajouter une règle

1. Ajouter le code dans l'enum Prisma `AnomalieCode` **et** dans `src/types/anomalie.type.ts` (une migration)
2. Ajouter l'entrée dans `ANOMALIE_DEFINITIONS`
3. Implémenter la règle dans `src/lib/anomalies/regles/<categorie>.regle.ts` avec `defineRegle`
4. Tests unitaires : la règle est pure, aucune base nécessaire
