# Rôles et périmètres géographiques

Un user a accès à Bhasile si son compte est **activé**. Ses droits viennent de son **périmètre** s'il est agent, de ses **binômes** s'il est opérateur.

![Périmètres et binômes](perimeters_and_grants.png)

## Modèle

### Tables

| Table / colonne                     | Rôle                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Perimeter`                         | Service nommé (« DDETS Finistère », « SGAR Bretagne »), nom unique. Porte les binômes d'écriture de ses agents ; aucun s'il est national.                                    |
| `User.perimeterId`                  | Le périmètre d'un agent. Un seul par agent, partagé entre plusieurs agents.                                                                                                  |
| `Grant`                             | Binôme `rôle × zone` : `role` (`LECTEUR` < `EDITEUR` < `ADMIN`), `scope`, cible selon le scope. Appartient à un périmètre (`perimeterId`) ou à un user opérateur (`userId`). |
| `User.operateurId`                  | Renseigné = user opérateur.                                                                                                                                                  |
| `User.isActivated`, `deactivatedAt` | État du compte, lu par `getAccountStatus` seulement.                                                                                                                         |
| `User.isSuperAdmin`                 | Équipe Bhasile.                                                                                                                                                              |

Plusieurs périmètres peuvent couvrir la même zone.

### Qui a quels droits

- **Désactivé** : rien.
- **En attente** : droits de contact seulement (\*).
- **Superadmin** : tous les droits, hors messagerie (ni message, ni fichier, ni accusé de lecture).
- **Agent** : rattaché obligatoirement à un unique périmètre. Droits : la lecture nationale, commune à tous les agents et calculée, plus les binômes de son périmètre (aujourd'hui `ADMIN` sur sa région ou son département). Un périmètre national n'a aucun binôme : aucun agent n'écrit au niveau national, seul le superadmin a tous les droits.
- **Opérateur** : binômes « rôle × zone » attribués un à un, limités à son opérateur, plus ses droits de contact (\*). Aujourd'hui en lecture seule, sans CPOM ; certains champs lui sont masqués.
- **Activé sans périmètre ni opérateur** : droits de contact seulement (\*).

(\*) Droits de contact : un user non-agent qui figure comme contact (même email) dans la version affichée d'une structure finalisée lit cette structure, sans validation préalable. Avant la finalisation, les contacts n'ont été saisis que par l'opérateur et ne donnent rien. Seulement si `CONTACT_ACCESS_ENABLED=true`.

À noter pour les **emails** : users et contacts écrits sans espaces et en minuscules (`normalizeEmail`, `contactApiSchema`), puis comparés tels quels.

### Ce que couvre un binôme

Les droits d'un agent sont la lecture nationale, calculée, et les binômes de son périmètre ; ceux d'un opérateur sont ses binômes personnels. Les binômes s'additionnent, aucun ne restreint : sur une structure, le rôle le plus fort qui la couvre s'applique.

Trois rôles :

- **Lecteur** : voit ;
- **Éditeur** : droits Lecteur + renseigne les fiches ;
- **Admin** : droits Éditeur + gère les accès.

Zones :

- **Structures** : national = toutes ; région ou département = celles dont le département administratif est dans la zone ; structure = celle-là.
- **CPOM** : national = tous ; région ou département = ceux dont au moins un département est dans la zone, plus les CPOM régionaux de la région ; structure = ceux liés à cette structure.
- **Tarification** : droit d'édition sur la structure, binômes nationaux exclus (voir [Messagerie](messagerie.md)).
- **Opérateur** : tout est en plus restreint à son `operateurId`.

Une fiche hors périmètre renvoie une 404, pas une 403, pour ne pas révéler qu'elle existe ; une écriture sans droit renvoie une 403 et une requête sans session une 401.

## Choix et raisons

- **Périmètre ≠ binôme** : un périmètre (agents) est partagé par plusieurs agents et porte un nom métier ; un binôme d'opérateur est personnel et cumulable.
- **Lecture nationale calculée, écriture portée par le périmètre** : la lecture nationale vaut pour tous les agents et n'est recopiée nulle part. Ce qui distingue un périmètre est une donnée : un périmètre `EDITEUR` ou sur plusieurs zones ne demandera pas de code.
- **Statut déduit des rattachements** : agent = périmètre, opérateur = `operateurId`. Pas de `isAgent` qui pourrait contredire le périmètre.
- **Email patterns abandonnés** : par simplicité, pas de rattachement automatique par domaine d'email.
- **`isActivated` + `deactivatedAt`** : distingue « jamais activé » (écran de demande) de « désactivé » (affiché comme tel).
- **`scope` explicite** : un binôme sans cible ne donne rien, jamais tout.
- **Région distincte du département** : couvrir une région revient à couvrir ses départements, mais le métier distingue les deux niveaux : un binôme régional couvre aussi les CPOM régionaux, et la messagerie sépare DREETS et DDETS (signature des messages, notifications réservées aux périmètres départementaux).
- **Suppressions** : supprimer une zone, une structure ou un périmètre supprime ses binômes (`Cascade`) ; un périmètre qui a des agents ne se supprime pas (`Restrict`), un opérateur qui a des users non plus.

## Pages et menu par profil

Les données sont filtrées par CASL (`rules.ts`) ; les pages, par `canAccessPage` (`lib/casl/pages.ts`), que le proxy consulte avant toute page ProConnect :

- **Agent** : toutes les pages.
- **Non-agent** (opérateur, contact) : les structures, et sa fiche opérateur sans ses pages de modification. Le tableau de bord le renvoie vers `/structures` ; les autres pages (CPOM, statistiques, ressources, liste des opérateurs) vers la 404.
- **Chemin absent des listes** : refusé à tous.

La fiche opérateur vérifie aussi la règle `read Operateur` (`getOperateur`) : un non-agent ne lit que son opérateur, même sans passer par le proxy. Le menu (`menu.util.ts`) et les liens de la fiche opérateur filtrent leurs entrées avec `canAccessPage` : ouvrir ou fermer une page dans `pages.ts` suffit. « Paramètres » reste derrière son flag, hors de `pages.ts`.

Fermer une page ne ferme pas son API : elle se ferme dans la route. `/api/statistiques` et `/api/statistiques/cartographie` répondent 403 à un non-agent. Le tableau de bord et la liste des opérateurs n'ont pas d'API, leurs pages appellent les services directement.

## Avant d'activer les contacts

`CONTACT_ACCESS_ENABLED=true` ouvre l'application à des non-agents, sans validation préalable. Ouverture prévue après #1742, qui limite ce qu'un non-agent voit sur la fiche structure et ferme aux non-agents les pages réservées aux agents et l'API des statistiques. Avant, fermer aussi ce qui reste ouvert à toute session : fichiers, suggestions d'opérateurs, pages de transformation.

## Reprise et mise en prod

Mise en prod du basculement :

1. sur #1773, lancer `20261104-reset-agents` (dry-run puis réel) et conserver sa sortie, seule trace des anciens binômes. Le document ne contient que des départements et des régions : les éditeurs nationaux, tous absents, restent actifs dans le périmètre national « Lecture nationale » (aucun binôme), donc en lecture nationale seule. Relancé après la bascule, le script les y laisse ;
2. déployer #1774 : la migration supprime `EmailPattern`, `User.emailPatternId` et `User.isAgent` ;
3. lancer `yarn one-off 20261104-clean-grants-and-emails [--dry-run]` : supprime les binômes sans user ni périmètre (anciens patterns) et les binômes personnels des agents, normalise les emails des users et des contacts. Entre 2 et 3, les binômes des agents sont déjà ignorés ; seuls les contacts à l'email en majuscules perdent leurs droits.

## Reste à faire

1. **Gestion des accès** :
   - écran de demande d'accès après ProConnect ;
   - création d'accès par les agents et par les opérateurs ;
   - API de gestion des binômes : un seul propriétaire, cible conforme au `scope`, hiérarchie stricte, refus d'un binôme déjà couvert par un droit égal ou supérieur sur une zone englobante (écriture Bretagne ⇒ pas d'écriture Finistère) ;
   - un admin ajoute ou retire un binôme dont la cible est dans son périmètre d'admin ; un admin opérateur ne gère que les users de son opérateur ;
   - désactivation par un admin qui couvre **tous** les binômes du user (inclusion complète) ; un agent national n'est géré que par un superadmin ;
   - affichage de la désactivation dans la messagerie.
2. **Ouverture aux opérateurs** :
   - authentification via ProConnect ;
   - fiche opérateur (#1742), statistiques filtrées sur `operateurId` sans RMU ;
   - lecture des CPOM de leur opérateur dont la zone recouvre, au moins en partie, leurs binômes (PR stackée à venir) ;
   - écriture par leurs binômes éditeur / admin, restreinte à leur opérateur, selon la matrice validée par le métier.
3. **Périmètres en écriture seule** (`EDITEUR`), si le besoin se présente : un binôme `EDITEUR` sur le périmètre suffit.

### Points d'attention restants

- **CPOM chargé sans ses champs de périmètre** : la règle CPOM lit `departements`, `structures`, `granularity` et `regionId` (`cpomScopeSelect`). Sans l'un d'eux, l'accès est refusé en silence.
- **Pas de contrainte en base** sur `Grant` (un seul propriétaire, user ou périmètre ; pas de binôme `NATIONAL` ou `STRUCTURE` sur un périmètre) ni sur `User` (périmètre et opérateur à la fois) : la cohérence est vérifiée par le one-off de reprise, puis par la gestion des accès.
- **Maisons mères et filiales** (`Operateur.parentId`) : non géré. **Un user sur deux opérateurs** : exclu.
- **Non filtré en lecture** : fiche opérateur, fichiers (`/api/files`, ouverts à toute session), pages de transformation, moyenne départementale d'activité, vues `reporting` / Metabase.
- **`ADMIN` = `EDITEUR`** tant que la gestion des accès n'existe pas.
