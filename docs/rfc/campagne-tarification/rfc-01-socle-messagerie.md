# Socle messagerie de la campagne de tarification

Le chantier fait passer dans Bhasile toute la campagne annuelle de tarification des CADA/CPH, du dépôt du CA et du BP par l'opérateur jusqu'aux documents de paiement (DAI, DAM, échéancier). Il repose sur **deux socles**, développés en parallèle et tous deux nécessaires aux briques suivantes :

- le socle **messagerie** (cette RFC) : où et comment opérateurs, DDETS et DREETS échangent messages et documents tout au long d'une campagne, et en gardent l'historique (archivage) ;
- le socle **donnée** (RFC séparée) : où vivent les montants, compte par compte, pour que les documents soient générés au lieu d'être recopiés.

Cette RFC propose :

- **un thread par structure et par campagne**, avec deux canaux : un canal **partagé** avec l'opérateur et un canal **agents** (DDETS et DREETS) ;
- **des documents typés** : chaque fichier envoyé dit ce qu'il est (CA, BP, RCA, L48, pièce justificative…) et dans quel état il est (brouillon, version finale, partagé). Les **étapes** de la campagne se calculent à partir de ces documents ;
- **un journal d'événements en ajout seul** : messages, documents, lectures et notifications sont des événements horodatés, jamais modifiés ni supprimés, qui forment la preuve ;
- **un outil descriptif, jamais prescriptif** : les échéances sont affichées et les retards signalés, mais rien n'est jamais bloqué. Le respect des délais reste de la responsabilité des agents et des opérateurs, pas de l'outil ;
- **des plugins** : des modules de code qui se branchent sur les événements et les types de documents. C'est par là qu'arriveront l'extraction des chiffres, l'analyse IA et la génération des documents.

## 1. Vocabulaire

| Terme           | Définition                                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Campagne**    | La campagne de tarification N (`TarificationCampaign`) : nationale, une par an. Elle porte la date de la DRL.                                                         |
| **Thread**      | Les échanges d'**une** structure pour **une** campagne. Une structure a souvent deux threads actifs (campagne en cours et suivante).                                  |
| **Canal**       | Chaque thread contient deux canaux : le canal **partagé** (opérateur + agents) et le canal **agents**. Un événement appartient à l'un ou l'autre selon sa visibilité. |
| **Événement**   | Tout ce qui arrive dans un thread : message, document, relecture, partage, notification… Jamais modifié ni supprimé.                                                  |
| **Document**    | Un fichier envoyé dans un canal, avec un **type** (CA, BP, L48…) et un **état** (brouillon, final, partagé).                                                          |
| **Étape**       | Un jalon de la campagne (CA déposé, L48 partagée, DAB partagée…). Son état se **calcule** à partir des documents ; il n'est jamais saisi.                             |
| **Échéance**    | Date réglementaire d'une étape, qui s'impose soit à l'opérateur, soit à l'État. Affichée, jamais bloquante.                                                           |
| **Lu / ouvert** | Première lecture d'un message, première ouverture d'un document, par utilisateur. Un fait, conservé.                                                                  |
| **Plugin**      | Module de code qui réagit aux événements et aux types de documents, et peut ajouter de l'UI.                                                                          |

## 2. Contexte

Douze documents par structure et par an. L'opérateur en produit trois (CA, BP, réponse au contradictoire) ; tous les autres reprennent ses chiffres. Une campagne N couvre **l'analyse du CA N-2 et la tarification du BP N**, soit environ 15 mois :

| Quand              | Quoi                                                     |
| ------------------ | -------------------------------------------------------- |
| 30 avril N-1       | Dépôt du CA N-2 par l'opérateur                          |
| 31 octobre N-1     | Dépôt du BP N par l'opérateur                            |
| après chaque dépôt | Questions-réponses et pièces justificatives              |
| déc. N-1 → mars N  | Rapport sur le CA (RCA), selon le territoire             |
| fin N-1 / début N  | DAI (douzièmes provisoires de N)                         |
| ~mai N             | Publication de la DRL au JO : J0                         |
| J0 → J48           | Questions-réponses, dialogue de gestion, envoi de la L48 |
| L48 → +8 jours     | Contradictoire (le silence vaut accord)                  |
| ≤ J60              | DAB                                                      |
| sept.-déc. N       | Arrêté de tarification, DAM / échéancier                 |

La campagne suit **deux parcours parallèles**, qui se rejoignent à la L48 :

- **parcours CA** : dépôt du CA → questions-réponses → RCA ;
- **parcours BP** : dépôt du BP → questions-réponses → L48 → contradictoire → DAB → arrêté (avec DAI, DAM, échéancier).

La L48 affecte le résultat du CA N-2 et tarife le BP N ; certaines DDETS y joignent le RCA. À un instant donné, une structure a donc **deux campagnes en cours** : en mai 2027, la campagne 2027 a débuté et les agents préparent la L48 et le CA 2026 a déjà été reçu en avril pour la campagne 2028.

## 3. Objectifs, non-objectifs et hypothèses

**Objectifs**

1. Chaque campagne d'une structure a un lieu unique où ses documents sont déposés, discutés, relus et partagés.
2. Les échanges et les documents font preuve : horodatés, en ajout seul, avec empreinte, avec la trace de qui les a lus ou ouverts.
3. La DREETS voit l'avancement et les échanges de son périmètre.
4. Les briques futures (extraction, IA, génération de documents, tableaux de bord) se branchent sans réécrire le socle.
5. Fonctionner sans dev après le chantier : seules des valeurs annuelles (date de la DRL) sont à saisir.
6. L'historique des échanges et des documents reste consultable des années après (archives publiques, § 4.6).

**Non-objectifs**

- Le registre des montants (socle donnée).
- L'extraction des chiffres, l'analyse IA, la génération de documents : ce sont des plugins.
- La signature électronique, l'envoi en recommandé (papier ou électronique, par ex. via Maileva comme en CVL), la saisie Chorus.
- Les circuits de validation internes (règles d'organisation propres à chaque service).
- Le ROB et la DRL en tant que documents (régionaux ou nationaux, pas par structure).
- Les threads multi-structures (H14).
- L'accès des agents nationaux aux threads de tarification.

**Hypothèses**

| #   | Hypothèse                                                                                                                                                                                                                         | Si c'est faux                                                                                                                            | Statut                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| H1  | **La réception de la L48 = sa première ouverture par un utilisateur de l'opérateur.** C'est la seule réception qui fait courir un délai : les dépôts du CA et du BP ont des dates fixes.                                          | —                                                                                                                                        | ✅ Validée                           |
| H2  | **Si la L48 n'est jamais ouverte, elle est réputée reçue 15 jours après son partage** (règle du CRPA, R112-20). Conséquence à accepter : la DAB peut alors déborder J60 (L48 à J48 + 15 jours + 8 jours de contradictoire = J71). | Définir une autre règle ; sans règle, un opérateur qui n'ouvre jamais la L48 bloque le contradictoire.                                   | ⏳ À valider                         |
| H3  | **Aucun accord exprès préalable de l'opérateur n'est requis** pour lui notifier les documents par Bhasile (le CRPA, L112-15, l'exige ; l'article L100-3 pourrait en exclure les associations gestionnaires).                      | Recueillir et tracer cet accord avant le premier partage.                                                                                | ✅ Validée                           |
| H4  | **Le partage dans Bhasile + le mail valent notification**, sans recommandé.                                                                                                                                                       | Brancher un envoi recommandé comme plugin.                                                                                               | ✅ Validée                           |
| H5  | **Les échéances sont en jours calendaires, sans report** (week-end, jour férié).                                                                                                                                                  | Ajouter un calendrier des jours fériés.                                                                                                  | ✅ Validée                           |
| H6  | **Une structure ne change jamais d'opérateur.**                                                                                                                                                                                   | Le code le permet aujourd'hui : figer `operateurId` sur `Thread`, décider ce que voit le repreneur.                                      | ✅ Validée                           |
| H7  | **Les documents financiers restent modifiables** via les formulaires existants.                                                                                                                                                   | Le miroir (§ 4.7) se simplifie.                                                                                                          | ✅ Validée                           |
| H8  | **Le déroulé de la campagne est national** ; chaque DREETS peut seulement préciser un calendrier indicatif (§ 5).                                                                                                                 | Ajouter des règles par territoire.                                                                                                       | ✅ Validée                           |
| H9  | **Un document peut porter plusieurs types** (par ex. une L48 qui contient le RCA).                                                                                                                                                | Un document = un type ; le RCA intégré à la L48 se déclare par un événement « sans objet » sur l'étape RCA.                              | ✅ Validée                           |
| H10 | **Le volume reste faible** (quelques milliers d'événements par jour au pic).                                                                                                                                                      | Passer à pg-boss plus tôt.                                                                                                               | ✅ Validée                           |
| H11 | **Les dépendances externes** (cadre normalisé, atelier gabarits de novembre) **ne concernent que les plugins.**                                                                                                                   | Seuls les plugins concernés sont retardés.                                                                                               | ✅ Validée                           |
| H12 | **Les fichiers ne sont pas confidentiels, seuls les messages le sont** : côté agents, même règle d'accès que la fiche structure ; côté opérateur, ses structures seulement.                                                       | Ajouter une règle d'accès par visibilité pour les fichiers.                                                                              | ✅ Validée                           |
| H13 | **Les échéances État (J48, J60) ne sont visibles que des agents.** Demande de PDL et d'IdF, qui fixent à leurs opérateurs des délais internes plus courts.                                                                        | Les afficher aussi à l'opérateur, par transparence : simple règle d'affichage, sans impact sur le modèle.                                | Nope, on affiche tout aux opérateurs |
| H14 | **Les échanges restent par structure, y compris sous CPOM** (les CPOM « vrais » ne suivent que le parcours CA, § 4.3). Le nombre de CPOM va augmenter.                                                                            | Rattacher un thread soit à une structure, soit à un CPOM (deux colonnes exclusives) : ajout possible sans toucher aux threads existants. | ⏳ À valider                         |
| H15 | **La validation DREETS n'est jamais obligatoire** : une DDETS peut partager un document sans `APPROVED`.                                                                                                                          | Une règle par type de document dans le registre (par ex. pas de partage de L48 sans validation).                                         | ⏳ À valider                         |

## 4. Design

### 4.1 Modèle de données

Esquisse (noms définitifs en PR 1) :

```prisma
model TarificationCampaign {
  id             Int       @id @default(autoincrement())
  year           Int       @unique
  drlPublishedAt DateTime? @db.Date // saisie par un admin national
}

model Thread {                 // une structure × une campagne
  id          Int @id @default(autoincrement())
  structureId Int // onDelete: Restrict
  campaignId  Int // onDelete: Restrict
  createdAt   DateTime @default(now())
  @@unique([structureId, campaignId])
}

model ThreadEvent {            // ajout seul
  id          Int             @id @default(autoincrement())
  threadId    Int             // onDelete: Restrict
  type        ThreadEventType
  userId      Int?            // auteur ; null = système (cron, plugin)
  authorLevel AuthorLevel
  visibility  Visibility      // SHARED | AGENTS
  text        String?
  payload     Json?           // validé par le schéma Zod du type d'événement
  createdAt   DateTime        @default(now()) // horodatage serveur, fait foi
  documents   ThreadDocument[]
}

model ThreadDocument {         // un fichier typé dans un événement
  id           Int            @id @default(autoincrement())
  eventId      Int            // onDelete: Restrict
  fileUploadId Int            // onDelete: Restrict
  types        DocumentType[] // CA, BP, RCA, L48, PIECE_JUSTIFICATIVE… (H9)
  status       DocumentStatus // DRAFT | FINAL | SHARED
}

model ThreadEventReceipt {     // « lu » / « ouvert », ajout seul
  eventId   Int
  userId    Int
  kind      ReceiptKind        // READ | OPENED
  createdAt DateTime @default(now())
  @@unique([eventId, userId, kind])
}

model ThreadSubscription {     // écarts au défaut uniquement (§ 4.5)
  threadId     Int
  userId       Int
  visibility   Visibility
  isSubscribed Boolean
  @@id([threadId, userId, visibility])
}

model ThreadEventTask { eventId Int; pluginKey String; status TaskStatus } // tâches restant à exécuter après un événement (§ 4.8)

model FileUpload { /* existant */ sha256 String? }

enum Visibility     { SHARED AGENTS }
enum DocumentStatus { DRAFT FINAL SHARED }
enum ReceiptKind    { READ OPENED }
```

**Types d'événements** : `MESSAGE` (texte et/ou documents) ; `DOCUMENT_SHARED` (partage dans le canal partagé d'un document `FINAL` du canal agents) ; relecture (`SUBMITTED_FOR_REVIEW`, `APPROVED`, `CHANGES_REQUESTED`) ; `STEP_NOT_APPLICABLE` ; `TACIT_APPROVAL` ; miroir (`EXTERNAL_DOCUMENT`) ; mails (envoyé, échec) ; `PLUGIN_ERROR` ; et les types propres à chaque plugin.

**Paramètres en base** : la date de la DRL par campagne et la date de mise en service.

**Principes d'intégrité**

- **Ajout seul**, protégé par des triggers PostgreSQL contre les modifications accidentelles (`UPDATE`, `DELETE`, `TRUNCATE`) sur les événements, les documents et les accusés de lecture. Une correction est un nouvel événement. Le trigger protège contre les bugs, pas contre un administrateur de la base.
- **Création à la volée** : le thread et la campagne sont créés au premier événement (création idempotente sur leur clé unique). Aucun cron d'ouverture.
- **Aucune cascade** n'atteint un événement, un document ou ses fichiers. Une structure qui a un thread ne peut donc plus être supprimée : c'est voulu (archives), et aucun écran ne supprime de structure aujourd'hui. Le wipe des seeders (`prisma/utils/wipe.ts`, dev et préprod) lève explicitement la protection pour sa session.

### 4.2 Documents et états

Chaque fichier envoyé porte un **type** et un **état**, choisis par l'auteur au moment de l'envoi. Un document ne change jamais d'état en place : la version suivante est un nouvel événement.

| État     | Où                                                                            | Qui le voit         |
| -------- | ----------------------------------------------------------------------------- | ------------------- |
| `DRAFT`  | Canal agents, pour relecture                                                  | Agents              |
| `FINAL`  | Canal agents, version définitive (par ex. le scan signé), pas encore partagée | Agents              |
| `SHARED` | Canal partagé : remis à l'autre partie                                        | Agents et opérateur |

- **Les documents de l'opérateur** (CA, BP, réponse au contradictoire, pièces justificatives) sont `SHARED` d'office.
- **Les documents des agents** passent par `DRAFT` → relecture → `FINAL` → « envoyer à l'opérateur » → `SHARED`. **Valider n'est pas envoyer** : le partage est une action séparée (événement `DOCUMENT_SHARED`, qui pointe vers le même fichier).
- **Relecture DREETS** : sur un brouillon, la DREETS valide (`APPROVED`) ou demande des modifications (`CHANGES_REQUESTED`, avec la liste) ; la DDETS dépose une nouvelle version. Rien ne bloque : une DDETS peut partager sans validation (H15).
- **L'interface ne propose que les types pertinents** à ce moment de la campagne et pour cet émetteur (on ne peut pas déposer un BP dans la campagne suivante, ni un arrêté côté opérateur).
- **L'exercice d'un document se déduit** de son type et de la campagne : le CA d'une campagne N est le CA N-2, son BP est le BP N.

### 4.3 Étapes

Les étapes sont déclarées dans un registre typé en code, sur le modèle de `ANOMALIE_DEFINITIONS`. Leur état se **calcule** à partir des documents partagés : rien n'est stocké.

| Parcours | Étape                           | Sens               | Faite quand…                                               | Échéance (s'impose à)                                             |
| -------- | ------------------------------- | ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| CA       | CA déposé                       | Opérateur → agents | un `CA` est `SHARED`                                       | 30 avril N-1 (opérateur)                                          |
| CA       | RCA                             | Agents → opérateur | un `RCA` est `SHARED`                                      | ⚠️                                                                |
| BP       | BP déposé                       | Opérateur → agents | un `BP` est `SHARED`                                       | 31 octobre N-1 (opérateur)                                        |
| BP       | L48                             | Agents → opérateur | une `L48` est `SHARED`                                     | J48 (État)                                                        |
| BP       | Contradictoire                  | Opérateur → agents | une réponse est `SHARED`, ou `TACIT_APPROVAL` à l'échéance | 8 jours après la première ouverture de la L48 (opérateur, H1, H2) |
| BP       | DAB                             | Agents → opérateur | une `DAB` est `SHARED`                                     | J60 (État)                                                        |
| BP       | Arrêté et documents de paiement | Agents → opérateur | `ARRETE` (et `DAI`, `DAM`, `ECHEANCIER`) `SHARED`          | —                                                                 |

⚠️ = donnée à fournir par l'équipe métier avant la mise en service.

| État calculé     | Sens                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `EXPECTED`       | Prévue par les règles, pas encore faite                                                                   |
| `LATE`           | Pas faite et échéance dépassée (dépend du jour)                                                           |
| `DONE`           | Faite, à la date du premier document partagé                                                              |
| `NOT_APPLICABLE` | Déclarée sans objet par un agent (`STEP_NOT_APPLICABLE`, motif obligatoire) : CPOM, RCA intégré à la L48… |

- **Rien ne bloque.** On poste à tout moment, y compris après l'échéance ; une étape peut être faite avant la précédente. Une L48 modificative est simplement une nouvelle L48 partagée : le délai du contradictoire repart de sa première ouverture.
- **`TACIT_APPROVAL`** est posé automatiquement à l'échéance du contradictoire, s'il n'y a pas eu de réponse. Il est rattaché à **une** L48 (au plus un par L48) : une L48 modificative rouvre le contradictoire, même après un accord tacite sur la précédente. L'état de l'étape se calcule toujours sur la dernière L48 partagée.
- **Éligibilité** (règle nationale par structure) : structures autorisées (CADA, CPH ⚠️) ; CPOM « vrais » : parcours CA seulement ⚠️ ; structures subventionnées : aucun thread.

### 4.4 Droits et visibilité

- **Accès à un thread = droit d'édition sur la structure** (`canUpdateStructure`), pour les agents DDETS et DREETS et pour les opérateurs. Lire et participer relèvent du même droit ; les `LECTEUR` n'ont pas accès.
- **Les agents nationaux n'ont pas accès** aux threads de tarification. Ils n'interviennent pas dans le dialogue de tarification, et les services territoriaux préfèrent qu'ils n'y aient pas accès.
- **Fermé par défaut.** Les threads ne reprennent **pas** la règle de lecture actuelle de Bhasile, ouverte à tous (`docs/permissions.md`).
- **Deux canaux** : le canal **partagé** (`SHARED` : DDETS, DREETS, opérateur) et le canal **agents** (`AGENTS` : DDETS, DREETS). C'est un seul journal ; le canal d'un événement est sa visibilité.
- **La DREETS voit le canal partagé**, mais n'en est pas notifiée (§ 4.5).
- **Dates côté opérateur** : pour l'opérateur, un document partagé porte la date de son partage, jamais celle de son dépôt dans le canal agents. Rien de ce que l'API renvoie à l'opérateur ne laisse deviner l'activité du canal agents (dates, auteurs, versions).
- **Fichiers** : même règle d'accès que la fiche structure (H12). Un fichier de thread n'a pas de colonne parente sur `FileUpload` : `isOrphan` (`src/app/api/files/file.service.ts`) doit le reconnaître, sinon il serait lisible et supprimable par tous. Aucun fichier de thread n'est supprimable, par personne.
- **Dépendance au chantier accès opérateur** : `getPrincipal` (`src/app/api/files/file.service.ts`) classe aujourd'hui toute session comme agent pour l'accès aux fichiers. À aligner avec ce chantier.

### 4.5 Notifications, lectures et ouvertures

- **Le mail est une notification, jamais un contenu** : un lien vers le thread, avec le nom et l'empreinte du document s'il y en a un, mais ni texte ni pièce jointe.
- **Deux types de notification** : le mail, et les notifications dans l'outil (« non lu », « à traiter » sur le tableau de bord). Celles de l'outil se calculent à partir des accusés de lecture, sans rien stocker de plus ; le suivi d'un canal (`ThreadSubscription`) ne règle que les mails.
- **Sont notifiés tous les membres du canal, sauf l'auteur** :

  | Canal   | Notifiés par défaut                                             |
  | ------- | --------------------------------------------------------------- |
  | Partagé | Agents de la DDETS, utilisateurs de l'opérateur (pas la DREETS) |
  | Agents  | Agents de la DDETS et de la DREETS                              |

- **Chacun peut suivre ou ne plus suivre un canal** d'un thread (`ThreadSubscription`, qui ne stocke que les écarts au défaut). Une DREETS peut ainsi suivre le canal partagé d'une structure sensible.
- **Les notifications réglementaires ne se désactivent pas** : un document partagé par les agents à l'opérateur, et les relances d'échéance de l'opérateur.
- **Chaque envoi de mail est un événement** (destinataires, identifiant Brevo), dans le canal agents. Les rebonds produisent un événement visible des agents. Fournisseur : Brevo transactionnel.
- **« Lu » et « ouvert »** : la première lecture d'un message et la première ouverture d'un document sont enregistrées par utilisateur (`ThreadEventReceipt`, en ajout seul). La **première ouverture de la L48 par l'opérateur fait courir le délai du contradictoire** (H1). L'affichage (qui a lu quoi, et pour qui) est laissé au design.

### 4.6 Fichiers, preuve et conservation

- **Le dépôt fait foi pour le délai** : « CA déposé le 30/04 à 23h41 » est l'horodatage serveur de l'événement.
- **Versions = documents successifs dans le journal.** Aucun fichier d'un thread n'est jamais supprimé.
- **Empreinte SHA-256** de chaque fichier, calculée à l'upload.
- **Formats** : ajout de `.docx`, `.odt`, `.pptx` (rapports, brouillons) aux formats déjà acceptés (PDF, tableurs, images), pour les fichiers de thread uniquement. Les autres contextes (actes administratifs, documents financiers) gardent leurs formats actuels.

**Niveau de preuve** : un **faisceau d'indices**. Journal en ajout seul, horodatage serveur, empreinte du fichier, accusés d'ouverture, trace du mail chez un tiers (Brevo), et empreinte du document dans le mail reçu par l'opérateur. Ce n'est **pas** un horodatage qualifié eIDAS. Si un horodatage qualifié s'avère un besoin réglementaire, le pattern de Démarches Numériques (empreintes du jour horodatées chaque nuit par un tiers qualifié) se branche comme plugin (§ 5).

**Conservation** : le journal et les pièces sont des **archives publiques** (Code du patrimoine, L211-4) : leur durée de conservation est à définir avec la mission archives (durée d'utilité administrative et sort final), et aucune élimination n'est possible sans son visa. Une purge éventuelle sera paramétrée selon ce tableau de gestion. La question dépasse cette RFC : elle concerne aussi les documents déjà stockés dans Bhasile. Les pièces peuvent contenir des données nominatives (salariés, demandeurs d'asile). Le tableau de gestion (mission archives du ministère) et une analyse d'impact (AIPD, avec le DPO) sont à établir avant la mise en service.

### 4.7 Intégration avec les documents financiers

Les documents financiers existants (`DocumentFinancier`, déposés par les agents via la finalisation, l'actualisation et la modification) restent lus partout : fiche structure, CPOM, actualisation. Le socle s'y articule dans les deux sens, **toujours par copie** :

| Sens                          | Déclencheur                                                              | Effet                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thread → documents financiers | Un document passe en `SHARED`                                            | Un plugin crée le document financier correspondant, avec sa propre copie du fichier. Un document redéposé (CA corrigé) **remplace** le précédent. |
| Documents financiers → thread | Document financier créé, remplacé ou supprimé via un formulaire existant | Événement `EXTERNAL_DOCUMENT` dans le thread, avec copie du fichier (simple trace si suppression)                                                 |

- **Les pièces justificatives restent uniquement dans le thread** : elles ne sont pas copiées dans les documents financiers.
- **Pourquoi la copie plutôt qu'un pointeur vers le même fichier** : retirer un document financier dans un formulaire appelle `DELETE /api/files/[key]`, qui supprime l'objet S3 **avant** la ligne en base. Si la ligne était partagée avec un thread, la contrainte en base refuserait la suppression, mais trop tard : le fichier aurait déjà disparu du bucket, et le journal pointerait vers un fichier qui n'existe plus.
- **Garde-fous** : seuls les documents financiers d'une campagne en cours déclenchent quelque chose (pas les reprises d'historique) ; la suppression d'un document financier est tracée, elle ne modifie pas le thread ; les documents financiers de CPOM et ceux du formulaire d'ajout de structure sont hors miroir.

### 4.8 Plugins

Un plugin est un **module de code**, déclaré par clé, qui se branche sur un **type d'événement** ou un **type de document** (« quand un CA est partagé, extraire les montants »). Il peut écrire dans ses propres tables (par ex. le registre des montants) et afficher des composants dans des emplacements prévus de l'écran.

**Contrat**

1. Un plugin ne modifie **jamais** le journal directement : il passe par le service d'ajout d'événement.
2. Un plugin ne bloque rien : son verdict (« fichier non conforme au cadre normalisé ») est un événement d'information.
3. L'échec d'un plugin ne casse pas le thread : il devient un événement `PLUGIN_ERROR` visible des agents.
4. Un plugin est **idempotent** : rejoué après une panne, il ne produit pas d'effet en double.

**Exécution** : chaque événement enregistre, **dans la même transaction**, les tâches que ses plugins doivent exécuter (`ThreadEventTask` : « après cet événement, il reste à envoyer tel mail, à copier tel document »). Les plugins s'exécutent juste après, et un cron reprend ce qui n'a pas abouti : un redémarrage du conteneur ne peut pas faire perdre un mail sans bruit. Quand arriveront les plugins lents (extraction, Albert API), **pg-boss** (une file de tâches dans PostgreSQL, écrite dans la même transaction) prendra le relais, sans changer le contrat.

**Plugins livrés par le socle** : la copie vers les documents financiers (§ 4.7) et les mails (§ 4.5).

### 4.9 Échéances

- **Uniquement les échéances réglementaires**, nationales, calculées : dates fixes (dépôts), J48 et J60 (depuis la DRL), contradictoire (depuis la première ouverture de la L48).
- **Chaque échéance indique à qui elle s'impose.** Une échéance opérateur (dépôts, contradictoire) est visible par tous ; une échéance État (J48, J60) n'est visible que des agents (H13).
- **Jours calendaires, sans report** (H5), comptés en heure de Paris.
- **La DRL est saisie par un admin national** chaque année (directement en base pour l'instant, puis dans le back office de pérennisation).
- **Les calendriers internes des DREETS** (« envoyez-nous tout à J45 ») ne sont pas des échéances : ils relèvent d'un plugin d'affichage (§ 5).

### 4.10 Interface

- **Une page par campagne** dans la fiche structure : les deux canaux en ordre chronologique, la frise des deux parcours (CA et BP) avec l'état de chaque étape, et les documents utiles de la campagne (dont ceux de N-2 et N-1, rappelés depuis la fiche structure).
- **Un bloc « Tarification » sur le dashboard**, sur le gabarit des blocs existants, filtré comme eux et par campagne. L'opérateur a le même bloc sur son propre dashboard, limité à ses structures. Le tableau de bord agrégé DREETS se branchera sur le même service.

### 4.11 Mise en service

La campagne 2027 sera à moitié passée hors de Bhasile au lancement : CA 2025, BP 2027, DAI et parfois RCA auront déjà circulé par mail.

- **Un script d'amorçage** rattache aux threads 2027 les documents financiers déjà présents (BP 2027, CA 2025…), par le miroir. Les échanges antérieurs restent hors Bhasile.
- **Une date de mise en service en base** : une échéance antérieure ne déclenche jamais `LATE`.
- **Mise en service avant le 30 avril 2027** : le premier usage réel sera le dépôt des CA 2026 (campagne 2028), quelques semaines avant la bascule de la DRL 2027.
- **Mise en prod invisible pour les utilisateurs** : tout part en prod au fil des PR ; avant la mise en service, seuls les superadmins voient la page et le bloc dashboard.

## 5. Points d'accroche des briques futures

| Brique future                                          | Se branche sur                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Calendrier régional de la DREETS                       | Plugin : texte libre par région et par campagne, saisi par la DREETS, affiché dans le canal agents, sans contrôle     |
| Relances avant échéance                                | Plugin mail + états calculés des étapes                                                                               |
| Vérification du cadre normalisé au dépôt               | Plugin sur un `CA` / `BP` partagé ; verdict en événement d'information, dans le thread                                |
| Extraction des chiffres                                | Plugin (pg-boss) sur un `CA` / `BP` partagé ; écrit dans le registre des montants (socle donnée)                      |
| Pré-analyse (écarts N-1, ratios)                       | Plugin de lecture du registre ; résultat dans le canal agents                                                         |
| Agent IA (Albert API)                                  | Plugin (pg-boss) ; sorties structurées par compte, dans le canal agents                                               |
| Pré-rédaction RCA / L48, génération DAB / arrêté / DAM | Plugins de génération ; gabarits par territoire (atelier de novembre) ; brouillon posté dans le canal agents          |
| Horodatage qualifié (si besoin réglementaire)          | Plugin quotidien : empreintes des événements du jour, horodatées par un tiers qualifié (pattern Démarches Numériques) |
| Tableau de bord DREETS agrégé                          | Même service que le bloc dashboard                                                                                    |
| Consolidation N-1                                      | Socle donnée                                                                                                          |
| Pré-remplissage de l'actualisation                     | Les documents financiers copiés depuis les threads                                                                    |

**Pour la data** : le contrat de plugin (§ 4.8) est l'interface entre ce socle et le socle donnée. Un plugin d'extraction lit le fichier d'un document typé, écrit dans le registre, et publie son verdict en événement. Il n'a besoin d'aucune autre prise.
