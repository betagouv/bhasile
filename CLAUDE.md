# Bhasile — Guide pour Claude

Bhasile est un outil de pilotage du parc d'hébergement pour demandeurs d'asile, à destination des agents DREETS/DDETS. Il remplace l'ancien outil "Place d'asile".

## Stack technique

- **Framework** : Next.js 16 (App Router), React 19, TypeScript 6
- **Design** : [DSFR](https://www.systeme-de-design.gouv.fr/) via `@codegouvfr/react-dsfr` + Tailwind 4 (avec patch DSFR pour éviter les conflits de layers CSS)
- **BDD** : PostgreSQL via Prisma 7
- **Validation** : Zod (schémas API dans `src/schemas/api/`, schémas form dans `src/schemas/forms/`)
- **Formulaires** : react-hook-form
- **Permissions** : CASL (`src/lib/casl/`)
- **Auth** : NextAuth — ProConnect pour les agents, mot de passe pour les opérateurs
- **Tests** : Vitest + React Testing Library (pas d'E2E en CI, Playwright disponible manuellement)

## Commandes essentielles

```bash
yarn dev                      # Serveur de dev (http://localhost:3000)
yarn test                     # Tests unitaires/intégration (hors DB)
yarn test:db                  # Tests repository (nécessite .env.test)
yarn lint                     # ESLint + Stylelint
yarn check:ts                 # Vérification TypeScript sans build
yarn pre-push                 # lint + check:ts + test + sql:format:check (lancé par Husky)

# Base de données
yarn prisma:migrate            # Crée et applique les migrations + génère le client
yarn prisma:push               # Prototype sans migration (dev uniquement)
yarn prisma:seed               # Remplit avec des données de test
yarn prisma:reset              # Remet à zéro
yarn prasd                     # reset + seed + apply-views (raccourci dev)
yarn apply-views:dev           # Applique les vues SQL (dev)
yarn sql:format:fix            # Formate les fichiers .sql de vues
```

## Structure du projet

```
src/
  app/
    (authenticated)/         # Pages nécessitant ProConnect
      (with-menu)/           # Pages avec la navigation principale
      structures/            # Pages sans navigation principale (utilisées dans le formulaire transformations)
    (not-authenticated)/     # Pages publiques
    (password-protected)/    # Formulaires opérateurs (mot de passe)
    api/                     # Routes API — une entité = un dossier
      [entite]/
        route.ts             # Gestion HTTP, validation, erreurs
        service.ts           # Logique métier
        repository.ts        # Requêtes Prisma uniquement, pas de logique
        schema.ts            # Schéma Zod appelé dans route
        util.ts              # Utilitaires du domaine (uniquement server-side)
    components/              # Composants réutilisables
    hooks/                   # Hooks React (logique + appels réseau)
    utils/                   # Utilitaires transverses
  schemas/                   # Schémas Zod partagés (API + forms) + types inférrés
  types/                     # Types de l'application non inférrés des schemas
  lib/
    casl/                    # Définition des abilities CASL
    next-auth/               # Config NextAuth
tests/                       # Même arborescence que src/
```

## Patterns et conventions

### API (route/service/repository)

- `route.ts` : parsing des params, appel du schéma Zod, gestion des codes HTTP, appel du service
- `service.ts` : logique métier, peut appeler le repository
- `repository.ts` : uniquement des requêtes Prisma, aucune logique
- Ne jamais mettre de logique dans `repository.ts`, ne jamais faire d'accès BDD dans `service.ts`

### Composants React

- Le composant en premier dans le fichier. Le type `Props` (et tout autre type ou fonction spécifique au composant) se place **en dessous** du composant, pas au-dessus.

### Gestion des permissions

- CASL est utilisé pour contrôler l'accès aux ressources selon le rôle de l'agent (DREETS/DDETS et département/région)
- Les abilities sont définies dans `src/lib/casl/`

### Migrations de BDD

- En dev : utiliser `yarn prisma:push` pour prototyper, puis agréger en une seule migration propre
- Ne jamais commiter de micro-migrations — une PR = une migration
- Après toute évolution de schéma : mettre à jour les seeders dans `prisma/seeders/` et les types dans `src/types/`

### Vues SQL

- Les vues sont dans `scripts/views/*.sql` et doivent être formatées (`yarn sql:format:fix`)
- Elles vivent dans le schéma `reporting`, séparé du schéma `public`
- Prisma les expose en lecture seule

### Tests

- Les tests de repository (`*.repository.test.ts`) sont exclus du `yarn test` standard — ils nécessitent une vraie base via `.env.test`
- Nommage des fichiers : `*.test.ts` pour unitaire/intégration, `*.repository.test.ts` pour les tests BDD
- Nommage des cas (`it`) : **en français**, en complétant naturellement « it … » → commencer par un verbe à la 3e personne (ex : `it("date les dnaStructures encore ouvertes à la finalisation")`, `it("rejette une transformation déjà finalisée")`). Pas de `it("should …")`.

### Nommage des types (schemas Zod)

Convention : `<Entité><Suffixe>` en PascalCase (ex : `OperateurApiRead`, `TransformationApiUpdate`, `ContactFormValues`).

| Suffixe      | Quand l'utiliser                                                |
| ------------ | --------------------------------------------------------------- |
| `FormValues` | Types utilisés dans l'UI des formulaires (`src/schemas/forms/`) |
| `ApiType`    | Type API quand lecture et écriture ne sont pas différenciées    |
| `ApiRead`    | Type API en lecture (lecture/écriture différenciées)            |
| `ApiWrite`   | Type API en écriture (création/update non différenciées)        |
| `ApiCreate`  | Type API en création (création/update différenciées)            |
| `ApiUpdate`  | Type API en update (création/update différenciées)              |

Quand un schéma `Api*` applique une transformation (coercition, `.transform()`, défaut, etc.), ce que le client envoie diffère du type inféré côté serveur. Ajouter alors un type parallèle suffixé `Client`, basé sur `z.input` au lieu de `z.infer` :

| Suffixe           | Pendant de  |
| ----------------- | ----------- |
| `ApiClient`       | `ApiType`   |
| `ApiWriteClient`  | `ApiWrite`  |
| `ApiCreateClient` | `ApiCreate` |
| `ApiUpdateClient` | `ApiUpdate` |

## Authentification

- **ProConnect** : agents DREETS/DDETS uniquement, donne accès au dashboard
- **Mot de passe** : opérateurs, accès limité aux formulaires `/ajout-structure` et `/ajout-adresses`
- **Dev bypass** : `DEV_AUTH_BYPASS=1` dans `.env` pour bypasser les accès privés en local

## Documentation détaillée

- [Architecture](docs/architecture.md) — stack, arborescence, services externes, schéma BDD
- [Base de données](docs/database.md) — migrations, vues SQL, process recommandé
- [Scripts](docs/scripts.md) — scripts one-off et récurrents (Scalingo)
- [Référentiel OFII](docs/ofii_referential.md) — mise à jour mensuelle du référentiel OFII
- [Tests](docs/tests.md) — outils, nommage des fichiers et des cas (`it` en français)

## Specs par chantier

- [Transformations de structures](docs/specs/transformations.md) — parcours de transformation (création, extension, contraction, fermeture, HUDA→CADA)
