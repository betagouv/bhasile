# Bhasile (ex-Place d'asile)

Piloter le parc de logements pour demandeurs d’asile

## ✨ Installation

Ce projet utilise [`yarn`](https://yarnpkg.com/) comme gestionnaire de dépendances.

D'abord, installez les dépendances :

```bash
yarn
```

## 👨‍💻 Lancement

Ensuite, lancez le projet :

```bash
yarn dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

## 🧪 Tests

Pour lancer les tests, exécutez :

```bash
yarn test
```

Pour lancer les tests en continu, exécutez :

```bash
yarn test:watch
```

### 🏄 Tests end-to-end

Pour lancer les tests end-to-end sans interface graphique, lancez le serveur de développement avec `yarn dev`, puis exécutez :

```bash
yarn test:e2e
```

Pour lancer les tests end-to-end avec interface graphique, exécutez :

```bash
yarn test:e2e:ui
```

## 🎨 Formattage du code

Pour vérifier que tout le code est bien formatté, exécutez :

```bash
yarn lint
```

Pour vérifier qu'uniquement le code JS/TS/TSX est bien formatté, exécutez :

```bash
yarn lint:ts
```

Pour vérifier qu'uniquement le code CSS est bien formatté, exécutez :

```bash
yarn lint:css
```

## 🗃️ Base de données

Tout le processus de création et migration de la base de données est décrit dans [ce document](docs/database.md)

## 🏗️ Architecture

Pour en savoir plus sur l'architecture du projet, allez sur [le document d'architecture](docs/architecture.md)

## 💅 Patch DSFR

En cas de mise à jour du DSFR, _il faut mettre à jour le patch_.

### Pourquoi ?

Par défaut le DSFR applique le CSS en dehors d'un layer ce qui pose des conflits avec Tailwind.
Il faut donc modifier le css du DSFR pour qu'il soit englobé dans un layer.
Et ce à chaque mise à jour du React-Dsfr.

### Voici les étapes à suivre :

1. Mettre à jour le package @codegouvfr/react-dsfr
2. Editer le fichier node_modules/@codegouvfr/react-dsfr/dsfr/dsfr.min.css en englobant le CSS dans un layer

```css
@layer dsfr {
  /* le CSS */
}
```

3. Patcher le package

```bash
npx patch-package @codegouvfr/react-dsfr
```

4. Vérifier le patch dans `patches/@codegouvfr+react-dsfr+{version}.patch`
5. Commit le patch
6. Le patch sera appliqué à chaque `yarn install`
7. Champagne !

## 🔓 Gestion des pages protégées par mot de passe

Les routes `/ajout-structure` et `/ajout-adresses` sont protégées par mot de passe. Les pages de dashboard sont protégées par un accès ProConnect.

Pour définir un ou plusieurs mots de passe, il suffit d'ajouter la variable `OPERATEUR_PASSWORDS` dans le fichier `.env`. Les mots de passe devront être séparées par des virgules.
`PAGE_PASSWORD` est une variable d'environnement legacy et sera bientôt supprimée.

En mode développement, il est possible aussi de bypasser ces accès privés grace à la variable d'environnement `DEV_AUTH_BYPASS=1`
Les pages sont ensuite accessibles via :

- http://localhost:3000/ajout-structure/123abc pour créer une structure (ici `123abc`)
- http://localhost:3000/structures pour accéder au tableau de bord

## 🚀 Mise en production

Pour mettre l'applcation en production, placez vous sur la branche `main` et exécutez :

```
git pull --rebase origin dev
git push --force-with-lease
```

### 🧑‍🔧 Ajout des opérateurs

Pour ajouter des opérateurs sur un environnement (dev ou prod), faites un `POST` sur `/api/operateurs` avec un tableau des opérateurs. Un JSON à jour est sur le Notion de l'équipe.

### 🏃 Exécution de scripts

L'exécution de scripts est décrite dans une [page dédiée](docs/scripts.md)
