# Rôles et périmètres géographiques

Un user a accès à Bhasile si son compte est **activé**. Ses droits viennent de son **périmètre** s'il est agent, de ses **binômes** s'il est opérateur.

![Périmètres et binômes](perimeters_and_grants.png)

## Modèle

### Général

La gestion de rôles d'un agent se fait obligatoirement par son rattachement à un unique périmètre.

La gestion de rôles d'un opérateur se fait :

- De manière automatique pour son accès à la fiche dont il est contact
- Par l'attribution de binômes "droits x périmètre géographique"

### Tables

| Table / colonne                     | Rôle                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Perimeter`                         | Service nommé (« DDETS Finistère », « SGAR Bretagne ») sur une zone `NATIONAL`, `REGION` ou `DEPARTEMENT`. Nom unique.        |
| `User.perimeterId`                  | Le périmètre d'un agent. Un seul par agent, partagé entre plusieurs agents.                                                   |
| `Grant`                             | Binôme personnel `rôle × zone` d'un user opérateur : `role` (`LECTEUR` < `EDITEUR` < `ADMIN`), `scope`, cible selon le scope. |
| `User.operateurId`                  | Renseigné = user opérateur.                                                                                                   |
| `User.isActivated`, `deactivatedAt` | État du compte, lu par `getAccountStatus` seulement.                                                                          |
| `User.isSuperAdmin`                 | Équipe Bhasile.                                                                                                               |

Plusieurs périmètres peuvent couvrir la même zone.

### Qui a quels droits

- **Désactivé** : rien. **En attente** : droits de contact seulement (\*).
- **Superadmin** : tous les droits, hors messagerie.
- **Agent** : lecture nationale + admin sur son périmètre.
- **Opérateur** : ses binômes + droits de contact (\*), limités à son opérateur ; lecture seule, pas de CPOM. Certains champs lui sont masqués
- **Activé sans périmètre ni opérateur** : droits de contact seulement (\*).

(\*) Seulement si `CONTACT_ACCESS_ENABLED=true`.

À noter pour les **emails** : users et contacts écrits sans espaces et en minuscules (`normalizeEmail`, `contactApiSchema`), puis comparés tels quels.

### Ce que couvre un binôme (gestion de droits pour les opérateurs)

Les binômes s'additionnent, aucun ne restreint : sur une structure, le rôle le plus fort qui la couvre s'applique. Trois rôles :

- Lecteur : peut voir seulement
- Éditeur : droits Lecteur + peut renseigner une fiche
- Admin : droits Éditeur + peut gérer les accès à la fiche

## Choix et raisons

- **Périmètre ≠ binôme** : un périmètre (agents) est partagé par plusieurs agents et porte un nom métier ; un binôme (opérateur) est personnel et cumulable.
- **Statut déduit des rattachements** : agent = périmètre, opérateur = `operateurId`. Pas de `isAgent` qui pourrait contredire le périmètre.
- **Email patterns abandonnés** : par simplicité on n'a pas de rattachement automatique sur le email pattern.
- **`isActivated` + `deactivatedAt`** : distingue « jamais activé » (écran de demande) de « désactivé » (affiché comme tel).
- **`scope` explicite** : un binôme ou un périmètre sans cible ne donne rien, jamais tout.
- **Évolutivité des structures** : une structure qui arrive en AURA entre dans les droits AURA.
- **Suppressions** : supprimer une zone ou une structure supprime ses binômes (`Cascade`) ; une zone ou un périmètre utilisés ne se suppriment pas (`Restrict`), un opérateur qui a des users non plus.

## Avant d'activer les contacts

`CONTACT_ACCESS_ENABLED=true` ouvre l'application à des non-agents, sans validation préalable. Ouverture prévue après #1742, qui limite ce qu'un non-agent voit sur la fiche structure. Avant, fermer aussi ce qui reste ouvert à toute session : fichiers, fiche et liste des opérateurs, pages de transformation, statistiques (le RMU suit le département), pages et menu réservés aux agents.

## Reprise et mise en prod

Mise en prod du basculement :

1. sur #1773, lancer `20261104-reset-agents` (dry-run puis réel) et conserver sa sortie, seule trace des anciens binômes ;
2. déployer #1774 : la migration supprime `EmailPattern`, `User.emailPatternId` et `User.isAgent` ;
3. lancer `yarn one-off 20261104-clean-grants-and-emails [--dry-run]` : supprime les binômes sans propriétaire (anciens patterns) et ceux des agents, normalise les emails des users et des contacts. Entre 2 et 3, les binômes des agents sont déjà ignorés ; seuls les contacts à l'email en majuscules perdent leurs droits.

## Reste à faire

1. **Gestion des accès** :
   - écran de demande d'accès après ProConnect ;
   - création d'accès par les agents et par les opérateurs ;
   - API de gestion des binômes : un seul propriétaire, cible conforme au `scope`, hiérarchie stricte, refus d'un binôme déjà couvert par un droit égal ou supérieur sur une zone englobante (écriture Bretagne ⇒ pas d'écriture Finistère) ;
   - un admin ajoute ou retire un binôme dont la cible est dans son périmètre d'admin ; un admin opérateur ne gère que les users de son opérateur ;
   - désactivation par un admin qui couvre **tous** les binômes du user (inclusion complète) ; pas de blocage de l'auto-déclassement d'un admin national ;
   - affichage de la désactivation dans la messagerie.
2. **Ouverture aux opérateurs** :
   - authentification via ProConnect ;
   - fiche opérateur (#1742), CPOM liés à leurs structures, statistiques filtrées sur `operateurId` sans RMU ;
   - écriture par leurs binômes éditeur / admin, restreinte à leur opérateur, selon la matrice validée par le métier.
3. **`Grant.userId` obligatoire**, une fois `20261104-clean-grants-and-emails` passé en prod.

Et les points d'attention restant

- **CPOM chargé sans ses champs de périmètre** : la règle CPOM lit `departements`, `structures`, `granularity` et `regionId` (`cpomScopeSelect`). Sans l'un d'eux, l'accès est refusé en silence.
- **Pas de contrainte en base** sur `Grant` ni sur `User` (périmètre et opérateur à la fois) : la cohérence est vérifiée par le one-off de reprise, puis par la gestion des accès.
- **Maisons mères et filiales** (`Operateur.parentId`) : non géré. **Un user sur deux opérateurs** : exclu.
- **Non filtré en lecture** : fiche opérateur, fichiers (`/api/files`, ouverts à toute session), pages de transformation, moyenne départementale d'activité, vues `reporting` / Metabase.
- **`ADMIN` = `EDITEUR`** tant que la gestion des accès n'existe pas.
