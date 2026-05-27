# tests/e2e

Suite e2e Playwright. Cohabite avec `tests/e2e-legacy/` pendant la transition — la suite legacy couvre l'ajout et la finalisation, briques en voie de disparition du produit. Une fois ces flux retirés, `tests/e2e-legacy/` sera supprimé.

## Périmètre

Trois flux couverts :

1. **Modification d'une structure** — `specs/structure-modification.spec.ts`
2. **Création d'un CPOM** — `specs/cpom-creation.spec.ts`
3. **Modification d'un CPOM** — `specs/cpom-modification.spec.ts`

Les flux d'ajout et de finalisation de structure sont testés dans `tests/e2e-legacy/`.

## Lancer

```bash
yarn test:e2e          # suite complète
yarn test:e2e:ui       # mode UI Playwright (interactif, debug)
yarn test:e2e -g notes # filtre par grep
```

## Pré-requis

- L'application tourne sur `E2E_BASE_URL` (défaut `http://localhost:3000`).
- DB Postgres accessible via `DATABASE_URL` (lecture/écriture).
- Variables d'env : `E2E_AGENT_EMAIL`, `E2E_AGENT_PASSWORD` pour ProConnect. `E2E_WORKERS` définit le nombre de tests en parallèle

## Principes

- **Fixtures Playwright** (`fixtures/test.ts`) pour le setup/teardown — pas de `try/finally` impératif.
- **Seeding direct Prisma** (`seed/`) — pas d'aller-retour via l'UI ni l'API HTTP pour préparer les données.
- **Isolation par identifiant unique** (`data/ids.ts`) : chaque test génère un `codeBhasile` préfixé `E2E-` + uuid court → suite parallélisable.
- **POM léger** (`pages/`) : une classe par page, méthodes nommées par intention métier, pas d'héritage. Sélecteurs sémantiques (`getByRole`, `getByLabel`).
- **Aucun import depuis `tests/e2e-legacy/`**. Seules dépendances autorisées : `src/types/*`, `@/generated/prisma/client`, `@/prisma-client`.

## Cleanup orphelins

Les fixtures nettoient en teardown même en cas d'échec, et `cleanupOrphans()` tourne en globalSetup pour purger tout résidu avant chaque run. Si jamais des records restent (kill -9, panne réseau), ils portent tous le préfixe `E2E-` et peuvent être supprimés en masse :

```sql
DELETE FROM "Cpom" WHERE name LIKE 'E2E-%';
DELETE FROM "Structure" WHERE "codeBhasile" LIKE 'E2E-%';
```

## Ajouter un test

1. Identifier la section concernée (structure-modification / cpom-creation / cpom-modification).
2. Récupérer les fixtures nécessaires via destructuring : `test("...", async ({ page, seededStructure }) => { ... })`.
3. Privilégier `getByRole` / `getByLabel`. Ajouter `data-testid` côté `src/` uniquement si le sémantique ne permet pas.
4. Pas de `waitForTimeout(...)` arbitraire. Toujours `expect(...).toBeVisible()` qui auto-wait.
