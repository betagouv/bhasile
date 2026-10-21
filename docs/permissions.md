# Rôles et périmètres géographiques

Un utilisateur a des **binômes** `rôle × périmètre`. Ses droits sont l'union de ses binômes.

Quatre périmètres, et rien d'autre : **national, région, département, structure**. Pas de périmètre sur mesure : « 3 départements » = 3 binômes.

## Modèle

Un binôme est une ligne de `Grant` :

| Colonne                                        | Rôle                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `userId` ou `emailPatternId`                   | Le propriétaire : un user, ou un pattern d'email   |
| `role`                                         | `LECTEUR`, `EDITEUR`, `ADMIN`                      |
| `scope`                                        | `NATIONAL`, `REGION`, `DEPARTEMENT`, `STRUCTURE`   |
| `regionId`, `departementNumero`, `structureId` | La cible, selon le `scope`. Aucune pour `NATIONAL` |

Sur `User` :

- `operateurId` : renseigné = user opérateur, vide = agent.
- `isSuperAdmin` : tous les droits, hors binômes. Réservé à l'équipe Bhasile.

## Connexion et accès

- **Connexion** : tout compte ProConnect peut se connecter. Le user est créé ou mis à jour à chaque connexion, et rattaché au pattern d'email qui lui correspond, s'il en existe un.
- **Accès à l'application** : il faut au moins un binôme effectif, ou être superadmin. Sinon, le user est redirigé vers `/acces-en-attente` et les routes d'API ProConnect lui renvoient 401 : il ne voit aucune structure, aucun CPOM, aucune statistique.
- **Droits de base** : ceux du pattern d'email, s'il en matche un.
- **Droits spécifiques** : des binômes ajoutés à la main sur le user.

Quels binômes s'appliquent à un user :

- s'il a des binômes personnels, **eux seuls** ;
- sinon, ceux du pattern d'email qui lui correspond (droits de base) ;
- sinon, aucun.

## Droits appliqués aujourd'hui

`LECTEUR` < `EDITEUR` < `ADMIN`. Les binômes s'additionnent, aucun ne restreint : sur une structure, le rôle le plus fort parmi les binômes qui la couvrent s'applique.

- Admin AURA + lecteur Isère : admin partout en AURA, Isère comprise.
- Lecteur AURA + admin Isère : admin en Isère, lecteur dans le reste d'AURA.

| Qui                      | Lecture                                | Écriture                               |
| ------------------------ | -------------------------------------- | -------------------------------------- |
| User sans binôme         | Rien (page `/acces-en-attente`)        | Rien                                   |
| Binôme `LECTEUR`         | Les structures et CPOM de ce périmètre | Rien                                   |
| Binôme `EDITEUR`/`ADMIN` | Les structures et CPOM de ce périmètre | Les structures et CPOM de ce périmètre |
| Superadmin               | Tout                                   | Tout                                   |

Ce que couvre un binôme :

- **Structures** : national = toutes ; région ou département = celles dont le département de rattachement est couvert ; structure = celle-là.
- **CPOM** : national = tous ; région ou département = ceux dont au moins un département est couvert ; structure = ceux liés à cette structure.
- **Opérateurs** : un agent éditeur, quel que soit son niveau, modifie tous les opérateurs ; un user opérateur `ADMIN` modifie le sien. La lecture des opérateurs n'est pas filtrée.
- **User opérateur** : tout est en plus restreint aux structures et CPOM de son opérateur.

Où s'applique la lecture : liste, carte et fiche des structures, statistiques et cartographie (donc leurs exports, RMU compris : ceux des départements couverts), liste et fiche des CPOM. Une fiche hors périmètre renvoie une 404, et sans user la lecture est refusée. Exception : la sélection de structure du formulaire opérateur (mot de passe, sans session) reste non filtrée, via `getFullStructuresForOperateur`. Le tableau de bord reste filtré sur l'**écriture** : il sert à agir.

Une seule définition de « ce que couvre un binôme » (`getStructureConditions` / `getCpomConditions` dans `casl/rules.ts`) sert à la fois aux règles CASL de lecture et d'écriture et au filtre de droits `getReadableStructureWhere` des statistiques.

Limites actuelles :

- **`ADMIN` = `EDITEUR`** tant que la gestion des binômes (PR 2) n'existe pas.
- **Non filtré en lecture** : la fiche opérateur (et la liste de ses structures), les fichiers (`/api/files`, ouverts à toute session), les pages de transformation, la moyenne départementale d'activité, et les vues `reporting` / Metabase (hors application).
- **Users opérateurs** : les RMU des statistiques ne sont filtrés que par département, pas par opérateur. À fermer avec les statistiques en PR 3.
- **Niveau structure** : pas d'accès aux transformations ni aux rappels CPOM du tableau de bord, qui restent contrôlés par département.

Règle à respecter dans `casl/rules.ts` : le code ne compare jamais les rôles entre eux. Tout droit donné à un rôle doit l'être aussi aux rôles supérieurs, sinon la hiérarchie casse.

## Historique

Les binômes ont remplacé les anciennes tables `Role` / `RoleDepartement` (PR #1694). Le one-off `20260929-migrate-roles-to-grants` a converti les données :

- pattern ou rôle manuel, mêmes binômes : `LECTEUR national` + `EDITEUR` sur sa zone, ou `EDITEUR national` pour NATIONAL ;
- un rôle qui couvrait une région entière a donné un binôme région, sinon un binôme par département.

Les anciennes tables et colonnes (`Role`, `RoleDepartement`, `User.roleId`, `EmailPattern.roleId`) sont supprimées. Le one-off n'est plus rejouable.

Deux changements visibles pour les agents sont arrivés avec les binômes :

- **CPOM** : un agent régional ou départemental ne modifie plus les CPOM hors de son périmètre. Avant, il les modifiait tous.
- **Brevo** : `PERIMETRE` envoie un libellé (« Bretagne », « National ») au lieu du nom de rôle, et `DEPARTEMENT` est vide pour un agent national.

Scripts : `fill-roles` remplace les binômes des patterns présents dans le CSV (le CSV fait foi), `brevo-push-users` lit les binômes.

## Choix et raisons

- **Pas de table `Perimetre`** : avec quatre niveaux fixes, la cible tient dans le binôme, et la hiérarchie admin se lit sur la géographie.
- **`scope` explicite** plutôt que déduit des colonnes vides : un binôme sans cible ne donne **rien**, jamais tout.
- **Région stockée comme région** : une structure qui arrive en AURA entre automatiquement dans les binômes AURA.
- **Droits de base portés par le pattern, jamais recopiés sur le user** : un changement de poste met les droits à jour tout seul.
- **Le manuel l'emporte sur le pattern**, comme l'ancien rôle manuel : un agent `@national.gouv.fr` rattaché à la Bretagne est lecteur national et éditeur Bretagne, rien de plus.
- **Une seule table `Grant`** pour les users et les patterns : mêmes colonnes des deux côtés.
- **Opérateur porté par le user, pas par le binôme** : un agent n'est jamais limité par opérateur, et un user opérateur appartient à un seul opérateur.
- **Pas d'enum `User.type`** : opérateur = `operateurId` renseigné, une seule source de vérité.
- **Suppressions** : supprimer une région, un département ou une structure supprime ses binômes (`Cascade`). Supprimer un opérateur qui a des users est refusé (`Restrict`).

## Points d'attention

- **CPOM chargé sans ses listes** : la règle CPOM lit `departements` et `structures`. Passer à CASL un CPOM sans ces listes lève une erreur au lieu de refuser.
- **Pas de contrainte en base sur `Grant`** : Prisma ne modélise pas les CHECK, et on ne veut pas de migration écrite à la main. Une ligne sans propriétaire ou sans cible est donc possible ; elle ne donne aucun droit. La cohérence est vérifiée par le service (PR 2).
- **Premier binôme personnel d'un agent** : il remplace tous ses droits de base. Il faut recopier ceux à garder, au minimum `LECTEUR national`.
- **Maisons mères et filiales** (`Operateur.parentId`) : non géré, à traiter plus tard.
- **Un user sur deux opérateurs** : cas exclu.

## Reste à faire

1. **PR 2, administration des binômes** :
   - API de gestion, qui vérifie un seul propriétaire et une cible conforme au `scope` ;
   - hiérarchie admin héritée de la géographie : un admin ajoute ou révoque un binôme, admin compris, si la cible est **dans** son propre périmètre d'admin.
     - National : tout.
     - Région : sa région, ses départements, leurs structures. Ni le national, ni les autres régions.
     - Département : son département et ses structures.
     - Structure : cette structure.
     - Un admin opérateur ne gère que les users de son opérateur.
   - matrice ressource × action × rôle × agent/opérateur validée par le métier.
2. **PR 3, ouverture aux opérateurs** :
   - invitation d'un user opérateur par un admin ;
   - authentification des users opérateurs via ProConnect (adresses gmail) ;
   - cloisonnement : toutes les règles d'un user opérateur filtrées sur son `operateurId` ;
   - lecture des opérateurs filtrée ;
   - champs réservés aux agents masqués : notes, justification d'anomalies, contrôles, évaluations, CPOM, finalisation de transformation ;
   - Metabase et statistiques fermés aux opérateurs.
