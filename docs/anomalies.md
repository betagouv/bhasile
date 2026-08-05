# Anomalies

Détection des incohérences de données d'une structure pour restitution à l'utilisateur. L'utilisateur peut décider de les corriger en base ou d'indiquer qu'elles sont "normales" et donc de les ignorer.

## Principe

Une seule implémentation des règles, en TypeScript, dans `src/lib/anomalies/` avec trois consommateurs :

| Consommateur               | Appel                                    | Fraîcheur                   |
| -------------------------- | ---------------------------------------- | --------------------------- |
| Fiche structure            | calcul à la lecture                      | toujours à jour             |
| Formulaire                 | calcul sur les valeurs `react-hook-form` | temps réel                  |
| Tableau de bord / Metabase | lecture de la table `Anomalie`           | recalcul complet périodique |

La table sert d'index et porte les annotations utilisateur. Elle n'est jamais la source de vérité des règles.

## Modèle

Clé primaire : `[structureId, code, year, targetId]`.

| Colonne                         | Sémantique                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`                          | Identifie la règle. Enum Prisma, dupliqué en TS dans `src/types/anomalie.type.ts` (test : `tests/lib/anomalies/anomalie.definition.test.ts`) |
| `year`                          | **Exercice** concerné. `0` = anomalie non rattachée à un exercice mais directement à la structure.                                           |
| `targetId`                      | Ligne fautive. `0` = anomalie portée par la structure. La table pointée est donnée par `target` dans le registre, jamais stockée en base     |
| `isJustified`                   | `null` jamais examinée, `true` justifiée, `false` rouverte                                                                                   |
| `justifiedById` / `justifiedAt` | Traçabilité, nécessaire à la réouverture                                                                                                     |

Une anomalie qui disparaît est supprimée et son commentaire est perdu.

TODO later : il n'existe **aucune table de définition** : les libellés et catégories vivent uniquement en TS. Les vues de reporting n'exposent donc que le `code`, à charge de Metabase d'en faire la lecture.

## Vues de reporting (pour Metabase)

Les anciennes vues thématiques `004a`–`004f` sont supprimées.

| Vue                                   | Rôle                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `reporting.structures_anomalies`      | Nouvelle surface, une ligne par anomalie, avec `year` et `target_id`                |
| `reporting.structures_global_quality` | Compatibilité : pivot sur `Anomalie`, colonnes `has_issue_*` historiques inchangées |

La seconde est conservée telle quelle parce que `fill-monthly-reporting.ts` alimente `monthly_structures_global_quality_count`, table d'historique dont les colonnes portent ces noms. Elle ré-agrège les anomalies au niveau structure plutôt que par année (ce que faisaient les `BOOL_OR`) donc les comptages mensuels restent comparables à l'historique déjà stocké.

La correspondance colonne x codes vit dans `src/lib/anomalies/anomalie.reporting.ts`, avec un test qui échoue si un code est ajouté sans être reporté dans la vue.

TODO : ⚠️ La vue est vide tant que `recompute-anomalies` n'a pas tourné. Après un déploiement, le lancer **avant** le reporting mensuel du 1er, sinon des zéros sont écrits dans l'historique.

## Exhaustivité

Les 34 règles sont **toutes calculées et persistées**. `isDisplayed` ne gouverne que l'affichage front : exposer une règle supplémentaire aux agents est un changement de booléen.

## Moteur

`computeAnomalies(contexte, { currentYear })` -> `{ detected, evaluatedCodes }`.

Toutes les tranches de `AnomalieContext` sont optionnelles. Une règle déclare celles dont elle a besoin dans `requires` et n'est évaluée que si elles sont **toutes** présentes, ce qui permet au formulaire de n'en fournir qu'une partie. Dans `evaluates`, elles sont typées non-optionnelles.

Le formulaire construit son contexte en écrasant la seule tranche en cours d'édition :

```ts
computeAnomalies(
  { ...serverContext, typologies: watch("typologies") },
  { currentYear }
);
```

## Réconciliation

⚠️ La suppression est **restreinte à `evaluatedCodes`**.

`reconcileAnomalies` ([anomalie.repository.ts](../src/app/api/anomalies/anomalie.repository.ts)), en une transaction :

1. `createMany` + `skipDuplicates` des détections : les lignes existantes ne sont pas touchées, `commentaire` et `isJustified` survivent
2. `deleteMany` des anomalies dont le `code` est dans `evaluatedCodes` et qui ne sont pas redétectées

## Entrées

| Quoi                      | Où                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Recalcul d'une structure  | `recomputeAnomalies(structureId)`                                                            |
| Recalcul complet          | `yarn script recompute-anomalies`                                                            |
| Date                      | `getNow()` -> `currentYear` en découle, les règles ne lisent jamais l'heure                  |
| Tarifs journaliers cibles | `TARIF_JOURNALIER_CIBLE` (JSON). Absent -> `COUT_JOURNALIER_GT_TARIF_CIBLE` ne déclenche pas |

## Pour ajouter une règle

1. Ajouter le code dans l'enum Prisma `AnomalieCode` **et** dans `src/types/anomalie.type.ts` (une migration)
2. Ajouter l'entrée dans `ANOMALIE_DEFINITIONS`
3. Implémenter la règle dans `src/lib/anomalies/rules/<category>.rule.ts` avec `defineRule`
4. Ajouter la règle aux vues reporting si besoin
5. Implémenter les tests unitaires
