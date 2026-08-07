# Tests

## Outils

- **Vitest** + React Testing Library (unitaire, intégration, composants).
- Pas d'E2E en CI ; Playwright disponible manuellement.

## Commandes

```bash
yarn test         # unitaire/intégration/composants (hors BDD)
yarn test:db      # tests repository (nécessite .env.test, vraie base Postgres)
```

## Exécution en CI

`.github/workflows/ci.yml` tourne sur chaque PR vers `dev` et sur chaque push sur `dev`, en deux jobs parallèles :

| Job        | Contenu                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `checks`   | `yarn lint`, `yarn check:ts`, `yarn test`, `yarn sql:format:check`                                     |
| `db-tests` | Postgres 17 éphémère (service container) → `prisma migrate deploy` → `prisma db seed` → `yarn test:db` |

La base du job `db-tests` est créée puis détruite à chaque run : deux PR simultanées n'ont aucun état
partagé. Le seed utilise une graine faker fixe ([prisma/seed.ts](../prisma/seed.ts)) pour que le jeu de
données soit reproductible d'un run à l'autre ; `FAKER_SEED=<n>` permet de rejouer avec une autre graine.

`yarn pre-push` ne lance **pas** les tests (voir [CLAUDE.md](../CLAUDE.md)) : ils sont couverts par la CI.

## Nommage des fichiers

| Fichier                    | Usage                                                     |
| -------------------------- | --------------------------------------------------------- |
| `*.test.ts` / `*.test.tsx` | Unitaire, intégration, composants (hors BDD)              |
| `*.repository.test.ts`     | Tests BDD (exclus de `yarn test`, requièrent `.env.test`) |

L'arborescence de `tests/` reflète celle de `src/`.

## Nommage des cas (`it` / `describe`)

Les descriptions de cas sont **en français** et doivent **compléter naturellement la phrase « it … »**.
Concrètement : commencer par un **verbe conjugué à la 3e personne** (le sujet implicite étant la
fonction/le composant sous test).

```ts
// ✅ « it date … », « it inclut … », « it rejette … »
it("date les dnaStructures encore ouvertes d'une structure fermée à la finalisation", ...)
it("inclut les codes libres et ceux des structures de la transformation", ...)
it("rejette toute modification d'une transformation déjà finalisée", ...)

// ❌ à éviter
it("should set endDate on close", ...)        // anglais + "should"
it("endDate sur fermeture", ...)              // ne complète pas « it … » (pas de verbe)
```

`describe` nomme l'unité sous test (fichier/fonction/composant), pas une phrase :

```ts
describe("dna-codes.repository findAll", ...)
```
