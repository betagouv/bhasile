# Rôles et niveaux géographiques

Un utilisateur a des **binômes** `rôle × niveau`. Ses droits sont l'union de ses binômes.

Quatre niveaux, et rien d'autre : **national, région, département, structure**. Il n'y a pas de périmètre sur mesure : « 3 départements » = 3 binômes.

## Ce que fait la PR 1

Elle remplace `Role` / `RoleDepartement` par des binômes, **sans changement visible pour les agents**.

- **Schéma** : `UserGrant`, `EmailPatternGrant`, enums `AccessRole` et `GrantScope`, `User.type`, `User.isSuperAdmin`. La migration Prisma reste à générer.
- **Session** : `role` / `allowedDepartements` deviennent `type`, `isSuperAdmin`, `grants` (régions déjà résolues en départements).
- **CASL** : une règle `update Structure` par binôme `EDITEUR` / `ADMIN`. La lecture reste ouverte à tous, comme avant.
- **One-off** `20260929-migrate-roles-to-grants` :
  - un pattern devient `VIEWER national` + `EDITEUR` sur sa zone (`EDITEUR national` pour NATIONAL) ;
  - un rôle manuel devient `EDITEUR` sur sa zone ;
  - un rôle qui couvre une région entière donne un binôme région, sinon un binôme par département.
- **`fill-roles`** et **`brevo-push-users`** passent sur les binômes.

## Modèle

Un binôme (`UserGrant` ou `EmailPatternGrant`) porte :

| Colonne                                        | Rôle                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `role`                                         | `VIEWER`, `EDITEUR`, `ADMIN`                                      |
| `scope`                                        | `NATIONAL`, `REGION`, `DEPARTEMENT`, `STRUCTURE`                  |
| `regionId`, `departementNumero`, `structureId` | La cible, selon le `scope`. Aucune pour `NATIONAL`                |
| `operateurId`                                  | Filtre **ET** optionnel : seulement les structures de l'opérateur |

- `EmailPatternGrant` : droits de base, déduits de l'email à chaque session, non modifiables par user.
- `UserGrant` : binômes attribués à la main, qui s'ajoutent aux droits de base.

Exemple : **Coallia AURA** = `{ scope: REGION, regionId: AURA, operateurId: Coallia }`.

## Choix et raisons

- **Pas de table `Perimetre`** : avec quatre niveaux fixes, la cible tient dans le binôme. Moins de tables, et la hiérarchie admin se lit directement sur la géographie.
- **`scope` explicite** plutôt que déduit des colonnes vides : un binôme sans cible ne donne **rien**, jamais tout.
- **Région stockée comme région** : une structure qui arrive en AURA entre automatiquement dans les binômes AURA.
- **Droits de base portés par le pattern, jamais recopiés sur le user** : un changement de poste met les droits à jour tout seul, et ils restent non modifiables par construction.
- **Deux tables de binômes** plutôt qu'une ligne polymorphe `userId | aliasId` : de vraies clés étrangères, sans contrainte CHECK.
- **`onDelete: Cascade`** sur les cibles et l'opérateur : supprimer une région ou un opérateur supprime le binôme, il ne l'élargit pas.
- **Superadmin = booléen** sur `User`, hors binômes (`manage all`).
- **3 rôles, pas 6** : la matrice agent/opérateur se choisit dans `abilities.ts` selon `User.type`. Un opérateur n'a encore aucun droit d'écriture.

## Invariants à garantir (PR 2 et 3)

- **Cohérence `scope` / cible** : vérifiée par le service à la création (pas de CHECK en base).
- **Hiérarchie admin, héritée de la géographie** : un admin ajoute ou révoque un binôme, admin compris, si la cible est **dans** son propre niveau d'admin.
  - Admin national : tout.
  - Admin régional : sa région, ses départements, les structures de sa région. Ni le national, ni les autres régions.
  - Admin départemental : son département et ses structures.
  - Admin structure : cette structure.
  - Un admin avec `operateurId` ne distribue que des binômes du même opérateur.
- **Cloisonnement opérateur** : un binôme d'un user opérateur porte l'`operateurId` du user. Pas d'accès hors de son opérateur.
- **Réservé aux agents** : notes, justification d'anomalies, contrôles, évaluations, CPOM, finalisation de transformation.

## Reste à faire

1. **PR 1** : générer la migration Prisma, puis jouer le one-off.
2. **PR 1 bis, nettoyage** après passage du one-off en prod : supprimer `Role`, `RoleDepartement`, `User.roleId`, `EmailPattern.roleId`.
3. **PR 2, administration** : API de gestion des binômes avec la hiérarchie admin ci-dessus, et une matrice ressource × action × rôle × type validée par le métier.
4. **PR 3, ouverture aux opérateurs** :
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
