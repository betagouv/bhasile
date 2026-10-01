# Rôles et périmètres géographiques

Un utilisateur a des **binômes** `rôle × périmètre`. Ses droits sont l'union de ses binômes.

Quatre périmètres, et rien d'autre : **national, région, département, structure**. Il n'y a pas de périmètre sur mesure : « 3 départements » = 3 binômes.

## Ce que fait la PR 1

Elle remplace `Role` / `RoleDepartement` par des binômes, **sans changement visible pour les agents**.

- **Schéma** : `UserGrant`, `EmailPatternGrant`, enums `AccessRole` et `GrantScope`, `User.operateurId`, `User.isSuperAdmin`.
- **Session** : `role` / `allowedDepartements` deviennent `operateurId`, `isSuperAdmin`, `grants` (régions déjà résolues en départements).
- **CASL** : une règle `update Structure` par binôme `EDITEUR` / `ADMIN`. La lecture reste ouverte à tous, comme avant.
- **One-off** `20260929-migrate-roles-to-grants` :
  - pattern ou rôle manuel, mêmes binômes : `VIEWER national` + `EDITEUR` sur sa zone (`EDITEUR national` pour NATIONAL) ;
  - un rôle qui couvre une région entière donne un binôme région, sinon un binôme par département.
- **`fill-roles`** et **`brevo-push-users`** passent sur les binômes.

## Modèle

Un binôme (`UserGrant` ou `EmailPatternGrant`) porte :

| Colonne                                        | Rôle                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `role`                                         | `VIEWER`, `EDITEUR`, `ADMIN`                       |
| `scope`                                        | `NATIONAL`, `REGION`, `DEPARTEMENT`, `STRUCTURE`   |
| `regionId`, `departementNumero`, `structureId` | La cible, selon le `scope`. Aucune pour `NATIONAL` |

- `EmailPatternGrant` : droits de base, déduits de l'email à chaque session, non modifiables par user.
- `UserGrant` : binômes attribués à la main. Dès qu'un user en a, ils **remplacent** ceux de son pattern.
- `User.operateurId` : renseigné = user opérateur, limité aux structures de cet opérateur. Vide = agent.

Exemple : **Coallia AURA** = un user avec `operateurId: Coallia` et un binôme `{ scope: REGION, regionId: AURA }`.

## Choix et raisons

- **Pas de table `Perimetre`** : avec quatre niveaux fixes, la cible tient dans le binôme. Moins de tables, et la hiérarchie admin se lit directement sur la géographie.
- **`scope` explicite** plutôt que déduit des colonnes vides : un binôme sans cible ne donne **rien**, jamais tout.
- **Région stockée comme région** : une structure qui arrive en AURA entre automatiquement dans les binômes AURA.
- **Droits de base portés par le pattern, jamais recopiés sur le user** : un changement de poste met les droits à jour tout seul, et ils restent non modifiables par construction.
- **Deux tables de binômes** plutôt qu'une ligne polymorphe `userId | aliasId` : de vraies clés étrangères, sans contrainte CHECK.
- **Le manuel l'emporte sur le pattern**, comme `user.role ?? emailPattern.role` aujourd'hui : un agent `@national.gouv.fr` rattaché à la Bretagne est viewer national et éditeur Bretagne, rien de plus.
- **Opérateur porté par le user, pas par le binôme** : un agent n'est jamais limité par opérateur, et un user opérateur appartient à un seul opérateur. Un binôme hors de son opérateur est donc impossible à écrire.
- **Pas d'enum `User.type`** : opérateur = `operateurId` renseigné, une seule source de vérité.
- **`onDelete: Cascade`** sur les cibles : supprimer une région supprime le binôme, il ne l'élargit pas. `Restrict` sur `User.operateur` : supprimer un opérateur ne transforme pas ses users en agents.
- **Superadmin = booléen** sur `User`, hors binômes (`manage all`).
- **3 rôles, pas 6** : la matrice agent/opérateur se choisit dans `abilities.ts` selon `User.operateurId`. Un opérateur n'a encore aucun droit d'écriture.

## Invariants à garantir (PR 2 et 3)

- **Cohérence `scope` / cible** : vérifiée par le service à la création (pas de CHECK en base).
- **Hiérarchie admin, héritée de la géographie** : un admin ajoute ou révoque un binôme, admin compris, si la cible est **dans** son propre niveau d'admin.
  - Admin national : tout.
  - Admin régional : sa région, ses départements, les structures de sa région. Ni le national, ni les autres régions.
  - Admin départemental : son département et ses structures.
  - Admin structure : cette structure.
  - Un admin opérateur ne gère que les users de son opérateur.
- **Cloisonnement opérateur** : toutes les règles CASL d'un user opérateur sont filtrées sur son `operateurId`. Pas d'accès hors de son opérateur.
- **Réservé aux agents** : notes, justification d'anomalies, contrôles, évaluations, CPOM, finalisation de transformation.

## Points d'attention

- **Ajouter un binôme à un agent qui n'a que ses droits de base** : le premier `UserGrant` remplace tout son pattern. Il faut donc recopier les droits de base à garder (au minimum `VIEWER national`).
- **Maisons mères et filiales** (`Operateur.parentId`) : non géré. Un user du siège ne voit pas les structures des filiales. À traiter plus tard.
- **Un user sur deux opérateurs** : cas exclu, il n'arrivera pas.

## Reste à faire

1. **PR 1** : générer la migration Prisma.
2. **PR 1 bis, nettoyage** après passage du one-off en prod : retirer le one-off de `scripts/postdeploy.sh` et supprimer `Role`, `RoleDepartement`, `User.roleId`, `EmailPattern.roleId`.
3. **PR 2, administration** : API de gestion des binômes avec la hiérarchie admin ci-dessus, et une matrice ressource × action × rôle × type validée par le métier.
4. **PR 3, ouverture aux opérateurs** :
   - invitation d'un user opérateur par un admin ;
   - règles CASL des opérateurs, filtrées sur `User.operateurId` ;
   - authentification individuelle (ProConnect ou magic link) ;
   - un email sans pattern est accepté mais ne voit rien tant qu'il n'est pas validé ;
   - lecture filtrée via `accessibleBy` dans les repositories (comme `includedStructureWhere`) ;
   - `select` restreints pour les champs réservés aux agents ;
   - Metabase et statistiques fermés aux opérateurs.

## Déploiement de la PR 1

Le one-off tourne dans `scripts/postdeploy.sh`, après les migrations : les binômes existent avant la mise en service du nouveau code, sans coupure d'écriture pour les agents. S'il échoue, le déploiement échoue.

Il ne migre que les patterns et utilisateurs **sans aucun binôme**. Le rejouer à chaque déploiement ne recrée donc pas un binôme modifié ou retiré entre-temps.

Limite : un utilisateur à rôle manuel dont on retire **tous** les binômes les retrouve au déploiement suivant. Elle disparaît avec la PR 1 bis, qui retire aussi la ligne du postdeploy.
