# Messagerie tripartite

Le chantier de la tarification est découpé en deux :

- **la campagne et la gestion des documents** ([RFC 02](rfc-02-tarification.md)) : étapes, documents typés, échéances, contradictoire, plugins ;
- **la messagerie** (cette RFC) : les échanges entre l'opérateur d'une structure, la DDETS et la DREETS, qui remplacent les mails, gardent l'historique et font preuve.

La messagerie est **agnostique** : elle ne connaît ni les étapes ni les documents. La tarification lui fournit ce qu'elle doit afficher (tags, ancres). Ce découpage suit l'interface, où les échanges vivent dans un panneau à part, et permet de livrer et de tester la messagerie en premier.

Cette RFC propose :

- **une conversation par tarification et par canal** : le canal **partagé** (opérateur, DDETS, DREETS) et le canal **agents** (DDETS, DREETS) sont deux conversations distinctes ;
- **un journal réduit aux messages, en ajout seul** : un message n'est jamais modifié ni retiré ; chaque lecture et chaque notification laisse une trace ;
- **un contrat avec la tarification** : elle fournit ses tags et ses ancres (les repères du sommaire), la messagerie les affiche sans les comprendre ;
- **un socle commun** (ajout seul, notifications par mail, fichiers, preuve), décrit ici et réutilisé par la gestion des documents.

## 1. Vocabulaire

| Terme            | Dans le code                   | Définition                                                                                                                              |
| ---------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Échanges**     | `Conversation`                 | Le fil chronologique des messages d'une tarification (une structure, une campagne), dans un canal.                                      |
| **Canal**        | `Visibility { SHARED AGENTS }` | Le canal **partagé** réunit l'opérateur et les agents ; le canal **agents** réunit la DDETS et la DREETS. Un canal = une conversation.  |
| **Message**      | `Message`                      | Un texte, avec ou sans pièces jointes.                                                                                                  |
| **Pièce jointe** | `FileUpload.messageId`         | Un fichier joint à un message.                                                                                                          |
| **Tag**          | `tagKey`                       | Étiquette choisie par un agent pour classer un message (par ex. « L48 »). La liste des tags est fournie par la tarification.            |
| **Phase**        | —                              | Le tag effectif d'un message : son tag s'il en a un, sinon la phase déduite de sa date et des ancres.                                   |
| **Ancre**        | `ConversationAnchor`           | Repère daté fourni par la tarification (« Envoi de la L48 »), affiché dans le sommaire et dans le fil. Une ancre peut ouvrir une phase. |
| **Lu**           | `MessageReceipt`               | Première lecture d'un message par un utilisateur. Un fait, conservé.                                                                    |

## 2. Contexte

Une campagne de tarification fait circuler une douzaine de documents et des dizaines de messages par structure et par an. Aujourd'hui, tout passe par mail :

- les pièces sont dispersées entre les boîtes des agents et des opérateurs, et les boîtes des DDETS sont limitées (environ 20 Mo) ;
- quand un agent ou un contact opérateur part, ses échanges partent avec lui ;
- il n'existe aucune trace commune de qui a envoyé quoi, à qui, et quand.

Les échanges sont **tripartites** : la DDETS mène, la DREETS suit et relit, l'opérateur répond et dépose.

## 3. Objectifs, non-objectifs et hypothèses

**Objectifs**

1. Un lieu unique d'échange par tarification, lisible dans l'ordre chronologique.
2. Les échanges font preuve : horodatés, en ajout seul, avec la trace des lectures et des notifications.
3. La DREETS voit les échanges de son périmètre.
4. La gestion des documents (étapes, gabarits, plugins) évolue sans toucher à la messagerie.
5. L'historique reste consultable des années après (archives publiques, § 4.8).

**Non-objectifs**

- **Envoyer un document officiel** (L48, DAB, arrêté…) : c'est le rôle de la gestion des documents (§ 4.3).
- **Répondre sous un message**, à la manière des threads de Slack (§ 5).
- **Marquer un message comme non lu.**

**Hypothèses**

Les numéros entre parenthèses renvoient à l'ancienne RFC du socle messagerie.

| #           | Hypothèse                                                                                                                                                                                                          | Si c'est faux                                                                                                             | Statut     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| H1 (ex-H6)  | **Une structure ne change jamais d'opérateur.**                                                                                                                                                                    | Le code le permet aujourd'hui : l'ancien opérateur garderait l'accès aux conversations. Décider ce que voit le repreneur. | ✅ Validée |
| H2 (ex-H10) | **Le volume reste faible** (quelques milliers de messages par jour au pic).                                                                                                                                        | Le polling (§ 4.6) coûte plus cher : passer aux SSE.                                                                      | ✅ Validée |
| H3 (ex-H12) | **Les fichiers ne sont pas confidentiels, seuls les messages le sont** : côté agents, même règle d'accès que la fiche structure ; côté opérateur, les pièces jointes du canal partagé de ses structures seulement. | Ajouter une règle d'accès par conversation pour les agents aussi.                                                         | ✅ Validée |
| H4 (ex-H16) | **Les opérateurs ont des comptes nominatifs à la mise en service** (chantier accès opérateur).                                                                                                                     | Seul le canal agents sert ; le canal partagé attend les comptes.                                                          | ✅ Validée |

## 4. Design

### 4.1 Modèle de données

Esquisse (noms définitifs en PR) :

```prisma
model TarificationCampaign {     // squelette, complété par la RFC 02
  id   Int @id @default(autoincrement())
  year Int @unique
}

model StructureTarification {    // une structure × une campagne ; squelette, complété par la RFC 02
  id            Int            @id @default(autoincrement())
  structureId   Int            // onDelete: Restrict
  campaignId    Int            // onDelete: Restrict
  conversations Conversation[]
  @@unique([structureId, campaignId])
}

model Conversation {             // une tarification × un canal
  id                      Int        @id @default(autoincrement())
  structureTarificationId Int        // onDelete: Restrict
  visibility              Visibility // fixée à la création
  createdAt               DateTime   @default(now())
  messages                Message[]
  @@unique([structureTarificationId, visibility])
}

model Message {                  // ajout seul, sauf tagKey
  id             Int          @id @default(autoincrement())
  conversationId Int          // onDelete: Restrict
  authorId       Int
  authorLevel    AuthorLevel  // tiré du Grant.scope de l'auteur à l'écriture ; le plus large l'emporte
  text           String
  tagKey         String?      // choisi par un agent ; seule colonne modifiable
  createdAt      DateTime     @default(now()) // horodatage serveur, fait foi
  attachments    FileUpload[]
  @@index([conversationId, createdAt])
}

model MessageReceipt {           // « lu », ajout seul
  messageId Int
  userId    Int
  createdAt DateTime @default(now())
  @@id([messageId, userId])
}

model MessageNotification {      // trace du mail envoyé ; son absence = message à notifier
  messageId  Int      @id
  recipients Json     // [{ userId, email, brevoMessageId }], vide si personne n'était à notifier
  createdAt  DateTime @default(now())
}

model StructureSubscription {    // suivi d'une structure (messagerie et tarification) : écarts au défaut uniquement
  structureId  Int
  userId       Int
  isSubscribed Boolean
  @@id([structureId, userId])
}

model FileUpload { /* existant */ messageId Int? /* onDelete: Restrict */ sha256 String? }

enum Visibility          { SHARED AGENTS }
enum AuthorLevel         { DEPARTEMENT REGION OPERATEUR }
```

`TarificationCampaign` et `StructureTarification` appartiennent à la gestion des documents (RFC 02), qui les complète (DRL, tarification hors Bhasile, étapes). La messagerie en a besoin pour exister : leur squelette est livré avec elle. La conversation pointe vers sa tarification ; la structure et la campagne s'obtiennent par jointure.

### 4.2 Campagnes et conversations

- **Une campagne N est ouverte du 1er janvier N-1 au 31 décembre N**, puis en lecture seule : plus aucun message ni changement de tag, mais la lecture reste possible et les lectures restent enregistrées. Une structure a donc toujours deux campagnes ouvertes (en 2027 : 2027 et 2028), et les précédentes en lecture seule. C'est un calcul sur la date du jour (heure de Paris), sans cron.
- **Une conversation par tarification et par canal**, au plus deux par tarification (unicité `(structureTarificationId, visibility)`). La visibilité appartient à la conversation, pas au message (§ 4.5).
- **Création à la volée** : la campagne, la tarification et la conversation sont créées au premier message (création idempotente sur leurs clés uniques). Une campagne ouverte sans message n'existe qu'à l'écran.

### 4.3 Messages

- **Un message est immuable** : ni modification, ni suppression, ni retrait. Une erreur, y compris un message posté dans le mauvais canal, se corrige par un nouveau message (le mail de notification ne contient pas le texte, § 4.7).
- **Une pièce jointe n'a aucun effet juridique** : elle ne fait courir aucun délai et n'apparaît pas comme un document de la tarification. Un document officiel (L48, DAB, arrêté) s'envoie depuis la gestion des documents, qui le date, le trace et l'affiche dans le fil comme ancre. Pas d'accusé d'ouverture sur les pièces jointes. L'aide en ligne et la formation le rappellent.
- **Un message n'a jamais valeur d'acte** : répondre au contradictoire, accepter ou contester une L48, se fait depuis la gestion des documents.
- **Tags** :
  - réservés aux agents, dans les deux canaux, y compris sur les messages de l'opérateur : un message de l'opérateur tagué « L48 » ressemblerait à une réponse au contradictoire, qui ne passe que par la gestion des documents ;
  - choisis à l'écriture ou modifiés ensuite, sur place : le tag est un classement, pas une preuve ; texte, auteur, dates et pièces jointes restent intouchables ;
  - stockés **seulement s'ils sont choisis** : par défaut, la phase d'un message se déduit de sa date (la dernière ancre qui ouvre une phase avant le message) ;
  - phase effective = `tagKey ?? phase déduite de la date`. Une phase déduite suit les corrections de la tarification (un document retiré déplace ses ancres) ; un tag choisi ne bouge plus.

### 4.4 Contrat avec la tarification

La messagerie définit ce qu'elle attend ; la tarification le fournit :

```ts
type ConversationTag = { key: string; label: string };
type ConversationAnchor = {
  id: string;
  label: string;
  date: Date;
  startsTagKey?: string;
};
type ConversationContext = {
  tags: ConversationTag[];
  anchors: ConversationAnchor[];
};
```

- **Côté écran**, le composant de messagerie reçoit le contexte en props, calculé par la page de la tarification.
- **Côté serveur**, la tarification passe la liste des tags au service de la messagerie, qui vérifie qu'un `tagKey` en fait partie.
- **La dépendance va dans un seul sens** : la tarification importe la messagerie, jamais l'inverse. La messagerie connaît le contrat (« il y a des tags et des ancres »), pas son contenu (« L48 », « procédure contradictoire »).
- Les ancres (réception du CA et du BP, envoi et ouverture des documents) sont décrites dans la RFC 02.

### 4.5 Droits et visibilité

- **Accès à une conversation = droit d'édition sur sa structure** (`canUpdateStructure`), hors grants `NATIONAL` : aujourd'hui, `canUpdateStructure` est vrai pour un éditeur national, il faut l'exclure explicitement. Lire et écrire relèvent du même droit ; les `LECTEUR` n'ont pas accès.
- **Fermé par défaut.** La messagerie ne reprend **pas** la règle de lecture actuelle de Bhasile, ouverte à tous (`docs/permissions.md`).
- **Opérateur** : la conversation partagée de ses structures. La conversation agents n'existe pas pour lui : l'accès se vérifie une fois, sur la conversation, et aucune requête ne peut faire fuiter le canal agents en oubliant un filtre.
- **DREETS** : les deux conversations des structures de sa région.
- **Superadmins** : lecture seule, partout. Ils n'écrivent jamais et leurs lectures ne laissent pas d'accusé : aucun message de l'équipe technique n'entre dans le journal d'une tarification. Les tests d'écriture se font en staging.
- **Agents nationaux** : aucun accès. Ils n'interviennent pas dans les échanges, et les services territoriaux préfèrent qu'ils n'y aient pas accès.

### 4.6 Lectures, non-lus et temps réel

- **Lu** : la première lecture d'un message par un utilisateur est enregistrée (`MessageReceipt`, en ajout seul). Par défaut, chaque participant voit qui a lu quoi et quand ; restreindre cet affichage plus tard (par ex. « lu par les services de l'État » côté opérateur) est une règle d'API, sans migration.
- **Non lu** = message d'une conversation accessible, écrit par un autre, sans accusé de lecture de l'utilisateur. La messagerie expose un compteur par structure, que le bloc tarification du dashboard affiche.
- **Temps réel** : tant que le panneau des échanges est ouvert, le client relit toute la conversation toutes les 10 à 15 secondes et remplace sa liste. Un curseur sur l'identifiant pourrait sauter un message (les identifiants sont attribués à l'insertion, pas au commit) ; une conversation compte quelques dizaines de messages, relire tout reste léger. Pas de websocket ni de SSE en V1 : en prod, l'application tourne sur plusieurs conteneurs, et pousser un message à tous les clients demanderait un canal de diffusion entre instances (`LISTEN/NOTIFY`). Le polling n'en a pas besoin, la base sert de point commun. Le passage aux SSE ne changerait pas le modèle.

### 4.7 Notifications

- **Le mail est une notification, jamais un contenu** : un lien vers la conversation, la structure, la campagne et le niveau de l'auteur ; ni texte, ni pièce jointe. Un mail se transfère, et les boîtes sont limitées.
- **Notifiés par défaut, sauf l'auteur**, selon le `Grant.scope` en base (la session ne distingue pas région et département) :

  | Destinataire                                      | Conversation partagée | Conversation agents |
  | ------------------------------------------------- | --------------------- | ------------------- |
  | Agent éditeur, grant `DEPARTEMENT` ou `STRUCTURE` | Oui                   | Oui                 |
  | Agent, grant `REGION`                             | Non                   | Non                 |
  | Utilisateur de l'opérateur                        | Oui                   | —                   |

  La DREETS n'est notifiée que des actions attendues d'elle, qui relèvent de la gestion des documents (une relecture demandée). C'est la DDETS qui mène les échanges.

- **Suivre ou ne plus suivre une structure** (`StructureSubscription`, qui ne stocke que les écarts au défaut) : une DREETS peut suivre une structure sensible ; un agent de DDETS, ne plus suivre celles qu'un collègue gère. Le suivi vaut pour la messagerie et pour la tarification.
- **Liste blanche** : chaque type d'événement d'une feature déclare s'il notifie ; un nouveau type ne notifie pas par défaut. Dans la messagerie, il n'y a qu'un type, le message, et il notifie.
- **Envoi sans file de tâches** : un message sans `MessageNotification` est un message à notifier. Après le commit, le serveur calcule les destinataires, envoie les mails, puis écrit la trace (même vide si personne n'était à notifier). Un cron reprend les messages restés sans trace ; au-delà de 24 h, il abandonne et remonte une alerte (Sentry). Si le serveur s'arrête au milieu d'un envoi, la reprise peut renvoyer un mail en double : sans gravité pour une notification.
- **Brevo transactionnel, à construire** : Brevo ne sert aujourd'hui qu'à synchroniser les contacts. L'identifiant Brevo de chaque mail est conservé (une trace chez un tiers). Les rebonds (contact parti, boîte supprimée) arrivent par webhook et sont tracés, en ajout seul, à côté du message, visibles des agents.

### 4.8 Socle commun

Ces règles valent pour la messagerie et pour la gestion des documents ; la RFC 02 y renvoie.

**Intégrité**

- **Ajout seul** : les repositories des journaux n'exposent ni `update` ni `delete` ; une correction est un nouvel enregistrement.
- **Triggers PostgreSQL** contre les modifications (`UPDATE`, `DELETE`, `TRUNCATE`), dans une PR dédiée avant la mise en service, quand les journaux deviennent une preuve : eux seuls couvrent aussi les scripts ponctuels et les requêtes manuelles. Ils protègent contre les accidents, pas contre un administrateur de la base. Sur `Message`, le trigger refuse tout `UPDATE` qui touche autre chose que `tagKey` (comparaison de `to_jsonb(NEW) - 'tagKey'` et `to_jsonb(OLD) - 'tagKey'`, qui reste juste quand on ajoute une colonne). Le wipe des seeders (`prisma/utils/wipe.ts`, dev et préprod) lève explicitement la protection pour sa session.
- **Aucune cascade** n'atteint un message, une trace ou un fichier. Une structure qui a des échanges ne peut plus être supprimée : c'est voulu (archives), et aucun écran ne supprime de structure aujourd'hui.

**Fichiers**

- **Empreinte SHA-256** de chaque fichier, calculée à l'upload.
- **Formats** : ajout de `.docx`, `.odt`, `.pptx` aux formats acceptés (PDF, tableurs, images), dans toute l'application : une seule liste, plus simple qu'une liste par contexte. Limite de 30 Mo inchangée ; au-delà de 50 Mo environ, il faudra un upload direct vers S3 par URL signée (le serveur charge aujourd'hui le fichier en mémoire).
- **Accès** : la règle est à construire, pas à reprendre. Aujourd'hui, `authorizeFileAccess` (`src/app/api/files/file.service.ts`) laisse toute session lire tout fichier rattaché, et `getPrincipal` classe toute session comme agent. Pour les fichiers des échanges : lecture selon l'accès à la conversation (§ 4.5), suppression jamais. `isOrphan` doit reconnaître `messageId`, sinon un fichier de message serait considéré comme orphelin, donc lisible et supprimable par tous.

**Preuve**

Un **faisceau d'indices** : journal en ajout seul, horodatage serveur, empreinte des fichiers, accusés de lecture, trace des mails chez un tiers (Brevo). Ce n'est **pas** un horodatage qualifié eIDAS ; s'il devient un besoin réglementaire, le pattern de Démarches Numériques (empreintes du jour horodatées chaque nuit par un tiers qualifié) se branchera en plus (§ 5).

**Conservation**

Les échanges et les pièces sont des **archives publiques** (Code du patrimoine, L211-4). Leur durée de conservation est à définir avec la mission archives (durée d'utilité administrative et sort final), et aucune élimination n'est possible sans son visa. En attendant, la durée déclarée au DataPass de Bhasile s'applique (15 ans, à vérifier), et aucune purge n'est implémentée. Les messages peuvent contenir des données nominatives (salariés, demandeurs d'asile) : le tableau de gestion et une analyse d'impact (AIPD, avec le DPO) sont à établir avant la mise en service.

**Mise en prod**

- Tout part en prod au fil des PR ; avant la mise en service, seuls les superadmins voient les échanges, en lecture seule (§ 4.5).
- Les crons ne tournent qu'en prod (`scripts/cron.sh`) : la reprise des notifications se recette en préprod.

### 4.9 Interface

- **Un panneau « Échanges »** à part, ouvert depuis l'écran de la tarification (un bouton flottant, par-dessus la navigation dans les documents).
- **Deux onglets** : « Tout le monde » (conversation partagée) et « Services de l'État seulement » (conversation agents), absent pour l'opérateur.
- **Un fil chronologique** : on écrit toujours à la suite ; « Écrivez un message ».
- **Un sommaire** : les ancres de la tarification et les pièces jointes, pour sauter à un moment du fil ; un filtre par phase.
- **Pièces jointes** affichées dans le fil, sous leur message ; elles n'apparaissent pas dans la navigation dans les documents.
- **Sélecteur de tag** à l'écriture, pour les agents, prérempli avec la phase en cours.

### 4.10 Mise en service

- La messagerie est livrée avant la gestion des documents. Elle est livrée avec le squelette de la tarification (§ 4.1) et une page minimale dans la fiche structure : le sélecteur de campagne et le panneau « Échanges », sans documents.
- Tests avec des opérateurs sur la staging dès décembre (échanges et pièces jointes), avant ceux de la gestion des documents.

## 5. Évolutions possibles

| Évolution                                                                 | Comment                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Répondre directement sous un message, hors du flux de la conversation     | À concevoir le jour venu.                                                 |
| Date de réponse attendue sur un message (« réponse attendue avant le … ») | Colonne nullable sur `Message`, indicateur dans le bloc dashboard.        |
| Regroupement des mails (un résumé plutôt que cinq mails en une minute)    | Le cron regroupe par destinataire les messages encore sans trace d'envoi. |
| Marquer comme non lu                                                      | Préférence modifiable, à part des accusés de lecture.                     |
| Recherche par mot-clé dans les échanges                                   | Recherche plein texte PostgreSQL sur le texte des messages.               |
| Temps réel poussé                                                         | SSE + `LISTEN/NOTIFY`, sans changer le modèle.                            |
| Horodatage qualifié (si besoin réglementaire)                             | Tâche quotidienne : empreintes du jour horodatées par un tiers qualifié.  |
