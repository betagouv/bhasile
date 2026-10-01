# Rôles et périmètres géographiques

Un utilisateur a des **binômes** `rôle × périmètre`. Ses droits sont l'union de ses binômes.

Quatre périmètres, et rien d'autre : **national, région, département, structure**. Pas de périmètre sur mesure : « 3 départements » = 3 binômes.

## Modèle

Un binôme est une ligne de `Grant` :

| Colonne                                        | Rôle                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `userId` ou `emailPatternId`                   | Le propriétaire : un user, ou un pattern d'email   |
| `role`                                         | `VIEWER`, `EDITEUR`, `ADMIN`                       |
| `scope`                                        | `NATIONAL`, `REGION`, `DEPARTEMENT`, `STRUCTURE`   |
| `regionId`, `departementNumero`, `structureId` | La cible, selon le `scope`. Aucune pour `NATIONAL` |

Sur `User` :

- `operateurId` : renseigné = user opérateur, vide = agent.
- `isSuperAdmin` : tous les droits, hors binômes. Réservé à l'équipe Bhasile.

Quels binômes s'appliquent à un user :

- s'il a des binômes personnels, **eux seuls** ;
- sinon, ceux du pattern d'email qui lui correspond (droits de base) ;
- sinon, aucun.

## Droits appliqués aujourd'hui

`VIEWER` < `EDITEUR` < `ADMIN`. Les binômes s'additionnent, aucun ne restreint : sur une structure, le rôle le plus fort parmi les binômes qui la couvrent s'applique.

- Admin AURA + viewer Isère : admin partout en AURA, Isère comprise.
- Viewer AURA + admin Isère : admin en Isère, viewer dans le reste d'AURA.

| Qui                        | Lecture | Structures               | CPOM                                          | Opérateurs |
| -------------------------- | ------- | ------------------------ | --------------------------------------------- | ---------- |
| Tout le monde              | Tout    | —                        | —                                             | —          |
| Agent `EDITEUR` ou `ADMIN` | Tout    | Celles de ses périmètres | Ceux liés au moins en partie à ses périmètres | Tous       |
| User opérateur `ADMIN`     | Tout    | —                        | —                                             | Le sien    |
| Autre user opérateur       | Tout    | —                        | —                                             | —          |
| Superadmin                 | Tout    | Toutes                   | Tous                                          | Tous       |

Détail pour un agent éditeur :

- **Structures** : national = toutes ; région ou département = celles dont le département de rattachement est couvert ; structure = celle-là.
- **CPOM** : national = tous ; région ou département = ceux dont au moins un département est couvert ; structure = ceux liés à cette structure.

Limites actuelles :

- **`ADMIN` = `EDITEUR`** tant que la gestion des binômes (PR 2) n'existe pas.
- **`VIEWER` ne restreint rien** : la lecture est ouverte à tous, user opérateur compris, jusqu'à la PR 3.
- **Niveau structure** : pas d'accès aux transformations ni aux rappels CPOM du tableau de bord, qui restent contrôlés par département.

Règle à respecter dans `abilities.ts` : le code ne compare jamais les rôles entre eux. Tout droit donné à un rôle doit l'être aussi aux rôles supérieurs, sinon la hiérarchie casse.

## Ce que change la PR 1

- **Schéma** : table `Grant`, enums `AccessRole` et `GrantScope`, `User.operateurId`, `User.isSuperAdmin`. `EmailPattern.roleId` devient nullable.
- **Session** : `role` / `allowedDepartements` deviennent `operateurId`, `isSuperAdmin`, `grants` (régions résolues en départements).
- **Contrôles par structure** : modification, actualisation, anomalies, suppression de fichiers, tableau de bord et liste des structures vérifient la structure, plus seulement son département.
- **`fill-roles`** : le CSV fait foi. Les binômes d'un pattern présent dans le fichier sont remplacés.
- **`brevo-push-users`** : lit les binômes.

Changements visibles pour les agents :

- **CPOM** : un agent régional ou départemental ne modifie plus les CPOM hors de son périmètre. Avant, il les modifiait tous.
- **Brevo** : `PERIMETRE` envoie un libellé (« Bretagne », « National ») au lieu du nom de rôle, et `DEPARTEMENT` est vide pour un agent national.

## Migration des données

Le one-off `20260929-migrate-roles-to-grants` convertit `Role` / `RoleDepartement` :

- pattern ou rôle manuel, mêmes binômes : `VIEWER national` + `EDITEUR` sur sa zone, ou `EDITEUR national` pour NATIONAL ;
- un rôle qui couvre une région entière donne un binôme région, sinon un binôme par département ;
- un rôle sans département est ignoré.

Il tourne dans `scripts/postdeploy.sh`, après les migrations et les vues. S'il échoue, le déploiement échoue.

Il ne migre que les patterns et utilisateurs **sans aucun binôme** : le rejouer à chaque déploiement ne recrée pas un binôme modifié ou retiré.

Limite : un user à rôle manuel dont on retire **tous** les binômes les retrouve au déploiement suivant. Elle disparaît avec la PR 1 bis.

## Choix et raisons

- **Pas de table `Perimetre`** : avec quatre niveaux fixes, la cible tient dans le binôme, et la hiérarchie admin se lit sur la géographie.
- **`scope` explicite** plutôt que déduit des colonnes vides : un binôme sans cible ne donne **rien**, jamais tout.
- **Région stockée comme région** : une structure qui arrive en AURA entre automatiquement dans les binômes AURA.
- **Droits de base portés par le pattern, jamais recopiés sur le user** : un changement de poste met les droits à jour tout seul.
- **Le manuel l'emporte sur le pattern**, comme `user.role ?? emailPattern.role` avant : un agent `@national.gouv.fr` rattaché à la Bretagne est viewer national et éditeur Bretagne, rien de plus.
- **Une seule table `Grant`** pour les users et les patterns : mêmes colonnes des deux côtés.
- **Opérateur porté par le user, pas par le binôme** : un agent n'est jamais limité par opérateur, et un user opérateur appartient à un seul opérateur.
- **Pas d'enum `User.type`** : opérateur = `operateurId` renseigné, une seule source de vérité.
- **Suppressions** : supprimer une région, un département ou une structure supprime ses binômes (`Cascade`). Supprimer un opérateur qui a des users est refusé (`Restrict`).

## Points d'attention

- **API CPOM et opérateurs non protégées** : `src/app/api/cpoms` et `src/app/api/operateurs` ne vérifient aucun droit. Les règles CPOM et opérateurs ne servent qu'au bouton « modifier » et à la suppression de fichiers. Antérieur à cette PR.
- **CPOM chargé sans ses listes** : la règle CPOM lit `departements` et `structures`. Passer à CASL un CPOM sans ces listes lève une erreur au lieu de refuser.
- **Pas de contrainte en base sur `Grant`** : une ligne sans propriétaire ou sans cible est possible. Elle ne donne aucun droit.
- **Premier binôme personnel d'un agent** : il remplace tous ses droits de base. Il faut recopier ceux à garder, au minimum `VIEWER national`.
- **Maisons mères et filiales** (`Operateur.parentId`) : non géré, à traiter plus tard.
- **Un user sur deux opérateurs** : cas exclu.

## Reste à faire

1. **PR 1 bis, nettoyage**, après passage du one-off en prod : retirer le one-off de `scripts/postdeploy.sh` et supprimer `Role`, `RoleDepartement`, `User.roleId`, `EmailPattern.roleId`.
2. **PR 2, administration des binômes** :
   - API de gestion, qui vérifie un seul propriétaire et une cible conforme au `scope` ;
   - hiérarchie admin héritée de la géographie : un admin ajoute ou révoque un binôme, admin compris, si la cible est **dans** son propre périmètre d'admin.
     - National : tout.
     - Région : sa région, ses départements, leurs structures. Ni le national, ni les autres régions.
     - Département : son département et ses structures.
     - Structure : cette structure.
     - Un admin opérateur ne gère que les users de son opérateur.
   - matrice ressource × action × rôle × agent/opérateur validée par le métier.
3. **PR 3, ouverture aux opérateurs** :
   - invitation d'un user opérateur par un admin ;
   - authentification individuelle (ProConnect ou magic link) ;
   - un email sans pattern est accepté mais ne voit rien tant qu'il n'est pas validé ;
   - cloisonnement : toutes les règles d'un user opérateur filtrées sur son `operateurId` ;
   - lecture filtrée via `accessibleBy` dans les repositories (comme `includedStructureWhere`) ;
   - champs réservés aux agents masqués : notes, justification d'anomalies, contrôles, évaluations, CPOM, finalisation de transformation ;
   - Metabase et statistiques fermés aux opérateurs.
