# Rôles et périmètres

Un utilisateur a des **binômes** `rôle × périmètre`. Ses droits sont l'union de ses binômes.

## Ce que fait la PR 1

Elle remplace `Role` / `RoleDepartement` par des binômes, **sans changement visible pour les agents**.

- **Schéma** : `Perimetre` (+ `PerimetreRegion`, `PerimetreDepartement`, `PerimetreStructure`), `UserGrant`, `EmailPatternGrant`, `User.type`, `User.isSuperAdmin`.
- **Session** : `role` / `allowedDepartements` deviennent `type`, `isSuperAdmin`, `grants` (régions déjà résolues en départements).
- **CASL** : une règle `update Structure` par binôme `EDITEUR` / `ADMIN`. La lecture reste ouverte à tous, comme avant.
- **One-off** `20260929-migrate-roles-to-grants` :
  - un pattern devient `VIEWER national` + `EDITEUR` sur sa zone (`EDITEUR national` pour NATIONAL) ;
  - un rôle manuel devient une ligne `EDITEUR` sur sa zone.
- **`fill-roles`** et **`brevo-push-users`** passent sur les binômes.

## Modèle

| Table                 | Rôle                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| `Perimetre`           | `isNational`, ou des zones (régions, départements) et des structures cochées      |
| `Perimetre.operateur` | Filtre **ET** : restreint tout le périmètre aux structures de cet opérateur       |
| `EmailPatternGrant`   | Droits de base, déduits de l'email à chaque session, non modifiables par user     |
| `UserGrant`           | Binômes attribués à la main, qui s'ajoutent aux droits de base                    |
| `AccessRole`          | `VIEWER`, `EDITEUR`, `ADMIN`. La déclinaison agent/opérateur vient de `User.type` |

Exemples :

- **Coallia AURA** : `{ operateurId: Coallia, regions: [AURA] }`.
- **Sur mesure** : un seul périmètre avec 3 départements et 2 structures.

## Choix et raisons

- **Tables de jointure plutôt que des tableaux d'ids** : intégrité référentielle, et c'est le motif déjà utilisé (`RoleDepartement`).
- **Zones dynamiques, structures cochées figées** : une structure qui arrive en AURA entre dans « Coallia AURA ». Une structure cochée ne bouge pas.
- **Région stockée comme région**, et non éclatée en départements : le nom et l'intention restent lisibles.
- **Droits de base portés par le pattern, jamais recopiés sur le user** : un changement de poste met les droits à jour tout seul, et ils restent non modifiables par construction.
- **Deux tables de binômes** (`UserGrant`, `EmailPatternGrant`) plutôt qu'une ligne polymorphe `userId | aliasId` : de vraies clés étrangères, sans contrainte CHECK. La répétition se limite à deux colonnes.
- **`isNational` explicite** : un périmètre vide ne donne **rien**, jamais tout.
- **`onDelete: Restrict`** sur `Perimetre.operateur` : supprimer un opérateur ne doit pas transformer « Coallia AURA » en « AURA ».
- **Superadmin = booléen** sur `User`, hors binômes (`manage all`).
- **3 rôles, pas 6** : la matrice agent/opérateur se choisit dans `abilities.ts` selon `User.type`. Un opérateur n'a encore aucun droit d'écriture.

## Invariants à garantir (PR 2 et 3)

- **Cloisonnement opérateur** : un binôme d'un user opérateur porte sur un périmètre dont l'`operateurId` est celui du user. Pas d'accès hors de son opérateur.
- **Admin** :
  - il ne crée des périmètres qu'à l'intérieur de ses périmètres d'admin, avec l'opérateur forcé ;
  - il peut nommer d'autres admins ;
  - un admin agent (DREETS AURA) gère les agents et les opérateurs de sa zone.
- **Réservé aux agents** : notes, justification d'anomalies, contrôles, évaluations, CPOM, finalisation de transformation.

## Reste à faire

1. **PR 1 bis, nettoyage** après passage du one-off en prod : supprimer `Role`, `RoleDepartement`, `User.roleId`, `EmailPattern.roleId`.
2. **PR 2, administration** : API de gestion des périmètres et des binômes avec les règles admin ci-dessus, et une matrice ressource × action × rôle × type validée par le métier.
3. **PR 3, ouverture aux opérateurs** :
   - `User.operateurId` et invitation par un admin ;
   - authentification individuelle (ProConnect ou magic link) ;
   - un email sans pattern est accepté mais ne voit rien tant qu'il n'est pas validé ;
   - lecture filtrée via `accessibleBy` dans les repositories (comme `includedStructureWhere`) ;
   - `select` restreints pour les champs réservés aux agents ;
   - Metabase et statistiques fermés aux opérateurs.

## Déploiement de la PR 1

Juste après le déploiement, lancer le one-off. Tant qu'il n'a pas tourné, les agents gardent la lecture mais perdent l'écriture.

```bash
scalingo -a <app> run "yarn one-off 20260929-migrate-roles-to-grants"
```
