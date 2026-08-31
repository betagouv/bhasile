# Bhasile (ex-Place d'asile)

[![CI](https://github.com/betagouv/bhasile/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/betagouv/bhasile/actions/workflows/ci.yml?query=branch%3Adev)

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

### 🧑 Se connecter avec un rôle

Le seed crée trois agents de test. Connectez-vous via ProConnect avec l'email voulu (n'importe quel mot de passe) :

| Rôle          | Email                                   | Périmètre     |
| ------------- | --------------------------------------- | ------------- |
| National      | `national@test.proconnect.gouv.fr`      | Tout          |
| Régional      | `regional@test.proconnect.gouv.fr`      | Île-de-France |
| Départemental | `departemental@test.proconnect.gouv.fr` | Paris (75)    |

Sur la page intermédiaire, restez en `eidas1` et cliquez sur "Se connecter"

Pour changer de rôle, déconnectez-vous et reconnectez-vous avec un autre email.

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

## 📥 Référentiel OFII

La procédure pour mettre à jour le référentiel OFII (et l’activité associée) tous les mois est décrite dans [ce document](docs/ofii_referential.md).

## 🤖 Mise à jour de dépendances

La procédure pour mettre à jour les dépendances (via dependabot) est décrite dans [ce document](docs/dependabot.md).

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

Pour définir un ou plusieurs mots de passe, il suffit d'ajouter la variable `OPERATEUR_PASSWORDS` dans le fichier `.env`. Les mots de passe devront être séparés par des virgules.
`PAGE_PASSWORD` est une variable d'environnement legacy et sera bientôt supprimée.

Les pages sont accessibles via :

- http://localhost:3000/ajout-structure pour créer une structure
- http://localhost:3000/structures pour accéder au tableau de bord

## 🚀 Mise en production

Pour mettre l'applcation en production, placez vous sur la branche `main` et exécutez :

```
git pull --rebase origin dev
git push --force-with-lease
```

### 🏃 Exécution de scripts

L'exécution de scripts est décrite dans une [page dédiée](docs/scripts.md)
