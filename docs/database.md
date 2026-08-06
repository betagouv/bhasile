# Base de données Bhasile

- [Base de données Bhasile](#base-de-données-bhasile)
  - [🧱 Construction de la base de données](#-construction-de-la-base-de-données)
  - [🪿 Focus sur les migrations](#-focus-sur-les-migrations)
    - [Évolution du schéma](#évolution-du-schéma)
  - [👁️‍🗨️ Vues SQL](#️️-vues-sql)
    - [Pourquoi des vues ?](#pourquoi-des-vues-)
    - [Création des vues](#création-des-vues)
    - [Vues sur Prisma](#vues-sur-prisma)
    - [Process recommandé](#process-recommandé)
    - [Notes importantes](#notes-importantes)

## 🧱 Construction de la base de données

Ce projet utilise [`Prisma`](https://www.prisma.io/docs) pour interagir avec la base de données PostgreSQL. Pour lancer la création de la base de données, remplissez d'abord la variable `DATABASE_URL` dans `.env` avec les identifiants de base de données. Puis, lancez la commande suivante pour construire la base de données :

```bash
yarn prisma:migrate
```

En cas de modification du schéma de données (dans `schema.prisma`), lancez la commande suivante et donnez un nom de migration en `camelCase` :

```bash
yarn prisma:migrate --create-only
```

Pour remplir la base avec des données de test, lancez :

```bash
yarn prisma:seed
```

En cas de besoin, la base de données peut être vidée avec :

```bash
yarn prisma:reset
```

Enfin, vous pouvez vérifier le contenu de la base de données en exécutant :

```bash
yarn prisma:studio
```

## 🪿 Focus sur les migrations

Le temps de développer la branche, il peut être utile d'utiliser l'outil de prototypage `yarn prisma:push`. Cela va venir faire évoluer la base en local mais ne générera pas les migrations, limitant ainsi le nombre de "micro migrations" associées à une PR.

Une fois que vous êtes satisfait et que vous voulez agréger vos modifications dans une migration, vous pouvez lancer la commande suivante :

```bash
yarn prisma:reset
yarn prisma:migrate:name <nom_migration>
```

Vous pouvez ensuite comparer qu'un dossier de migration a été créé avec son fichier (non vide) `migration.sql` et vérifier les opérations.

Enfin vous pouvez lancer le déploiement :

```bash
yarn prisma:deploy
```

### Évolution du schéma

À chaque évolution du schéma, vous devez également mettre à jour :

- Le seeder associé dans `src/prisma/seeders`
- Le type dans `src/types` et dans `src/app/api/structures`

## 👁️‍🗨️ Vues SQL

### Pourquoi des vues ?

Les vues sont créées afin de servir facilement différents outils (front de Bhasile, Metabase) avec les mêmes objets. Elles ne sont pas matérialisées et sont donc systématiquement à jour.

### Création des vues

Les vues sont créées en post-deploiement avec la commande

```bash
yarn prisma:apply-views
```

En local elles peuvent l'être avec :

```bash
yarn prisma:apply-views:dev
```

Elles pointent vers un schéma différent (par défaut `reporting`) afin de bien gérer la séparation "remplissage de la base de données" sur `public` et ses vues agrégées sur `reporting`.

Si vous souhaitez ajouter une vue, vous pouvez le faire dans `scripts/views/` sous la forme d'un fichier SQL

⚠️ Le bon formattage des vues est testé avant tout commit, vous pouvez également le tester avec :

```bash
yarn sql:format:check # Pour vérifier simplement le bon formattage
yarn sql:format:fix   # Pour le régler
```

### Vues sur Prisma

Prisma a récemment introduit le principe de [views](https://www.prisma.io/docs/orm/prisma-schema/data-model/views) (encore en preview)

Cela nécessite :

- L'ajout d'une fonctionnalité `views` dans `previewFeatures`
- L'ajout des schémas par table dans `datasource.schemas` (si on gère différents schémas)

### Process recommandé

L'ordre est le suivant :

- Modification éventuelle des tables du schema et migration prisma classique
- Ajout de vues dans le dossier puis exécution via

```bash
yarn prisma:apply-views
```

- Ajout des vues au schéma prisma (à la main)

### Notes importantes

- Les vues sont en lecture seule dans Prisma Client
- L'introspection (`npx prisma db pull`) peut être utilisée pour générer les blocs `view`, mais attention aux fichiers `.sql` générés automatiquement et au `prisma.schema` modifié automatiquement
- Éviter de commit les fichiers générés si on utilise l'introspection

Pour aller plus loin avec Prisma : 👉 [Source](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema)

## Budget de connexions

Le plan `postgresql-starter-512` expose `max_connections = 50`, dont 20 réservées à Scalingo : **le budget de l'app est de 30 connexions**, pas 50. Répartition :

| Consommateur           | Pool                                     | Pire cas                      |
| ---------------------- | ---------------------------------------- | ----------------------------- |
| Container web          | `DATABASE_POOL_MAX` (10)                 | 20 (×2 pendant un déploiement) |
| Container one-off/cron | 3 (posé par `scripts/run-one-off.sh`)    | 3                             |
| `postdeploy`           | `psql` + `prisma migrate deploy`         | 3                             |

Deux règles à respecter :

- Le pool se règle sur l'adapter dans `prisma/client.ts`, pas via `connection_limit` dans `DATABASE_URL` (paramètre Prisma 6, ignoré par les driver adapters).
- Le client Prisma est un singleton porté par `globalThis`, en dev **comme en production** : Next instancie ce module dans chaque layer de bundle (proxy, route handlers, RSC), et sans le singleton chacun ouvre son propre pool.

Pour inspecter les connexions en cours :

```sql
SELECT count(*), application_name, state FROM pg_stat_activity GROUP BY 2, 3 ORDER BY 1 DESC;
```
