# Tests

## Outils

- **Vitest** + React Testing Library (unitaire, intégration, composants).
- Pas d'E2E en CI ; Playwright disponible manuellement.

## Commandes

```bash
yarn test         # unitaire/intégration/composants (hors BDD)
yarn test:db      # tests repository (nécessite .env.test, vraie base Postgres)
```

## Nommage des fichiers

| Fichier                  | Usage                                          |
| ------------------------ | ---------------------------------------------- |
| `*.test.ts` / `*.test.tsx` | Unitaire, intégration, composants (hors BDD) |
| `*.repository.test.ts`   | Tests BDD (exclus de `yarn test`, requièrent `.env.test`) |

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
