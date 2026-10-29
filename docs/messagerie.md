# Messagerie tripartite

Les échanges entre l'opérateur d'une structure, la DDETS et la DREETS pendant une campagne de tarification. Elle remplace les mails, garde l'historique et fait preuve.

Le chantier de la tarification est découpé en deux :

- **la messagerie** (ce document) ;
- **la campagne et la gestion des documents** : étapes, documents typés, échéances, contradictoire, plugins.

La messagerie est **agnostique** : elle ne connaît ni les étapes ni les documents. La tarification lui fournit ce qu'elle doit afficher (tags, ancres). Ce découpage suit l'interface, où les échanges vivent dans un panneau à part, et permet de livrer et de tester la messagerie en premier.

Les décisions et leurs alternatives écartées sont dans l'[ancienne RFC](rfc/campagne-tarification/rfc-01-socle-messagerie.md), conservée pour l'historique. Ce document décrit ce qui est construit et se met à jour dans la même PR que le code.

## Vocabulaire

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

## Contexte

Une campagne de tarification fait circuler une douzaine de documents et des dizaines de messages par structure et par an. Aujourd'hui, tout passe par mail :

- les pièces sont dispersées entre les boîtes des agents et des opérateurs, et les boîtes des DDETS sont limitées (environ 20 Mo) ;
- quand un agent ou un contact opérateur part, ses échanges partent avec lui ;
- il n'existe aucune trace commune de qui a envoyé quoi, à qui, et quand.

Les échanges sont **tripartites** : la DDETS mène, la DREETS suit et relit, l'opérateur répond et dépose.

**Hors périmètre** :

- **envoyer un document officiel** (L48, DAB, arrêté…) : c'est le rôle de la gestion des documents (voir [Messages](#messages)) ;
- **répondre sous un message**, à la manière des threads de Slack (voir [Évolutions possibles](#évolutions-possibles)) ;
- **marquer un message comme non lu**.

## Postulats

Le design repose sur ces constats. S'ils deviennent faux, la colonne de droite dit quoi revoir.

| Postulat                                                                                                                                                 | Si ça devient faux                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Une structure ne change jamais d'opérateur.**                                                                                                          | Le code le permet aujourd'hui : l'ancien opérateur garderait l'accès aux conversations. Décider ce que voit le repreneur.                      |
| **Le volume reste faible** (quelques milliers de messages par jour au pic, quelques dizaines par conversation).                                          | Le polling coûte plus cher : passer aux SSE (voir [Lectures et temps réel](#lectures-non-lus-et-temps-réel)).                                  |
| **Les pièces jointes sont aussi confidentielles que les messages** : un fichier de message se lit selon l'accès à sa conversation, canal agents compris. | Pour les montrer plus largement (depuis la fiche structure par exemple), élargir la règle de lecture des fichiers de message ; sans migration. |
| **Les opérateurs ont des comptes nominatifs à la mise en service** (chantier accès opérateur).                                                           | Seul le canal agents sert ; le canal partagé attend les comptes.                                                                               |

## Modèle de données

```prisma
model TarificationCampaign {     // squelette, complété par la gestion des documents
  id   Int @id @default(autoincrement())
  year Int @unique
}

model StructureTarification {    // une structure × une campagne ; squelette, complété par la gestion des documents
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
  authorLevel    AuthorLevel  // tiré des grants de l'auteur à l'écriture ; le plus large l'emporte
  text           String
  tagKey         String?      // choisi par un agent ; seule colonne modifiable
  createdAt      DateTime     @default(now()) // horodatage serveur, fait foi
  attachments    FileUpload[]
  @@index([conversationId, id])
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

enum Visibility  { SHARED AGENTS }
enum AuthorLevel { DEPARTEMENT REGION OPERATEUR }
```

`TarificationCampaign` et `StructureTarification` appartiennent à la gestion des documents, qui les complète (DRL, tarification hors Bhasile, étapes). La messagerie en a besoin pour exister : leur squelette est livré avec elle. La conversation pointe vers sa tarification ; la structure et la campagne s'obtiennent par jointure.

`Message` n'a pas de `updatedAt` : seul `tagKey` change, et c'est un classement, pas une preuve.

## Campagnes et conversations

- **Une campagne N est ouverte du 1er janvier N-1 au 31 décembre N**, puis en lecture seule : plus aucun message ni changement de tag, mais la lecture reste possible et les lectures restent enregistrées. Une structure a donc toujours deux campagnes ouvertes (en 2027 : 2027 et 2028), et les précédentes en lecture seule. C'est un calcul sur l'année en cours (`CURRENT_YEAR`), sans cron.
- **Une conversation par tarification et par canal**, au plus deux par tarification (unicité `(structureTarificationId, visibility)`). La visibilité appartient à la conversation, pas au message : l'accès se vérifie une fois, sur la conversation, et aucune requête ne peut faire fuiter le canal agents en oubliant un filtre.
- **Création à la volée** : la tarification et la conversation sont créées au premier message (création idempotente sur leurs clés uniques). Une campagne ouverte sans message n'existe qu'à l'écran.

## Messages

- **Un message est immuable** : ni modification, ni suppression, ni retrait. Une erreur, y compris un message posté dans le mauvais canal, se corrige par un nouveau message (le mail de notification ne contient pas le texte, voir [Notifications](#notifications)).
- **Contenu** : texte de 10 000 caractères au plus, vide seulement s'il y a des pièces jointes ; 20 pièces jointes au plus.
- **Une pièce jointe n'a aucun effet juridique** : elle ne fait courir aucun délai et n'apparaît pas comme un document de la tarification. Un document officiel (L48, DAB, arrêté) s'envoie depuis la gestion des documents, qui le date, le trace et l'affiche dans le fil comme ancre. Pas d'accusé d'ouverture sur les pièces jointes. L'aide en ligne et la formation le rappellent.
- **Rattachement des pièces jointes** : le fichier est d'abord envoyé (`POST /api/files`), puis le message référence sa clé. Le rattachement se fait dans la même transaction que la création du message, et seulement pour un fichier orphelin : un fichier déjà rattaché ailleurs fait échouer l'envoi.
- **Un message n'a jamais valeur d'acte** : répondre au contradictoire, accepter ou contester une L48, se fait depuis la gestion des documents.
- **Tags** :
  - réservés aux agents, dans les deux canaux, y compris sur les messages de l'opérateur : un message de l'opérateur tagué « L48 » ressemblerait à une réponse au contradictoire, qui ne passe que par la gestion des documents ;
  - choisis à l'écriture ou modifiés ensuite, sur place : le tag est un classement, pas une preuve ; texte, auteur, dates et pièces jointes restent intouchables ;
  - stockés **seulement s'ils sont choisis** : par défaut, la phase d'un message se déduit de sa date (la dernière ancre qui ouvre une phase avant le message) ;
  - phase effective = `tagKey ?? phase déduite de la date`. Une phase déduite suit les corrections de la tarification (un document retiré déplace ses ancres) ; un tag choisi ne bouge plus.

## Contrat avec la tarification

La messagerie définit ce qu'elle attend (`src/types/conversation.type.ts`) ; la tarification le fournit :

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

- **Côté écran**, le composant de messagerie reçoit les tags en props, calculés par la page de la tarification.
- **Côté serveur**, la tarification passe la liste des tags au service de la messagerie, qui vérifie qu'un `tagKey` en fait partie.
- **La dépendance va dans un seul sens** : la tarification importe la messagerie, jamais l'inverse. La messagerie connaît le contrat (« il y a des tags et des ancres »), pas son contenu (« L48 », « procédure contradictoire »).
- Les ancres (réception du CA et du BP, envoi et ouverture des documents) relèvent de la gestion des documents. Tant qu'elle n'existe pas, la liste des ancres est vide et seuls les tags choisis classent les messages.

## Droits et visibilité

- **Accès à une conversation = droit d'édition sur sa structure** (`canUpdateStructure`), hors grants `NATIONAL` : `canUpdateStructure` est vrai pour un éditeur national, `canAccessTarification` l'exclut explicitement. Lire et écrire relèvent du même droit ; les `LECTEUR` n'ont pas accès.
- **Fermé par défaut.** La messagerie ne reprend **pas** la règle de lecture de Bhasile, ouverte à tous (voir [Permissions](permissions.md)).
- **Opérateur** : la conversation partagée de ses structures. La conversation agents n'existe pas pour lui (`canReadConversation`).
- **DREETS** : les deux conversations des structures de sa région.
- **Superadmins** : lecture seule, partout. Ils n'écrivent jamais et leurs lectures ne laissent pas d'accusé : aucun message de l'équipe technique n'entre dans le journal d'une tarification. Les tests d'écriture se font en staging.
- **Agents nationaux** : aucun accès. Ils n'interviennent pas dans les échanges, et les services territoriaux préfèrent qu'ils n'y aient pas accès.

## Lectures, non-lus et temps réel

- **Lu** : la première lecture d'un message par un utilisateur est enregistrée (`MessageReceipt`, en ajout seul). Par défaut, chaque participant voit qui a lu quoi et quand : la lecture d'une conversation renvoie les accusés de chaque message. Restreindre cet affichage plus tard (par ex. « lu par les services de l'État » côté opérateur) est une règle d'API, sans migration.
- **Accusé envoyé par l'écran** : le client n'envoie que les messages d'autrui sans accusé à son nom, et seulement quand ils sont affichés (onglet visible). Les superadmins n'en envoient jamais.
- **Non lu** = message d'une conversation accessible, écrit par un autre, sans accusé de lecture de l'utilisateur. La messagerie expose un compteur par structure, que le bloc tarification du dashboard affiche.
- **Temps réel** : tant que les échanges sont affichés, le client relit toute la conversation toutes les 10 secondes et remplace sa liste (`src/hooks/useConversationMessages.ts`).
  - La requête suivante ne part que 10 secondes après la réponse de la précédente (`setTimeout` chaîné) : un serveur lent n'accumule pas de requêtes.
  - Pause quand l'onglet du navigateur est caché, relecture immédiate au retour et après chaque envoi.
  - Pas de curseur sur l'identifiant : il pourrait sauter un message, car les identifiants sont attribués à l'insertion, pas au commit. Une conversation compte quelques dizaines de messages, relire tout reste léger.
  - Pas de websocket ni de SSE : en prod, l'application tourne sur deux conteneurs pendant un déploiement (plus si on la dimensionne à la hausse), et pousser un message à tous les clients demanderait un canal de diffusion entre instances (`LISTEN/NOTIFY`). Le polling n'en a pas besoin, la base sert de point commun. Le passage aux SSE ne changerait pas le modèle.

## Notifications

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

## Socle commun

Ces règles valent pour la messagerie et pour la gestion des documents, qui y renvoie.

**Intégrité**

- **Ajout seul** : les repositories des journaux n'exposent ni `update` ni `delete` ; une correction est un nouvel enregistrement.
- **Triggers PostgreSQL** contre les modifications (`UPDATE`, `DELETE`, `TRUNCATE`), posés avant la mise en service, quand les journaux deviennent une preuve : eux seuls couvrent aussi les scripts ponctuels et les requêtes manuelles. Ils protègent contre les accidents, pas contre un administrateur de la base. Sur `Message`, le trigger refuse tout `UPDATE` qui touche autre chose que `tagKey` (comparaison de `to_jsonb(NEW) - 'tagKey'` et `to_jsonb(OLD) - 'tagKey'`, qui reste juste quand on ajoute une colonne). Le wipe des seeders (`prisma/utils/wipe.ts`, dev et préprod) lève explicitement la protection pour sa session.
- **Aucune cascade** n'atteint un message ou une trace. Un fichier de message non plus, sauf requête forgée par un agent éditeur qui rattacherait sa clé à un autre parent (évaluation, contrôle, acte, document financier, logo), dont la suppression emporte le fichier : risque accepté, l'objet S3 reste. Une structure qui a des échanges ne peut plus être supprimée : c'est voulu (archives), et aucun écran ne supprime de structure aujourd'hui.

**Fichiers**

- **Empreinte SHA-256** de chaque fichier, calculée à l'upload.
- **Formats** : `.docx`, `.odt` et `.pptx` s'ajoutent aux formats acceptés (PDF, tableurs, images), dans toute l'application : une seule liste, plus simple qu'une liste par contexte. Limite de 30 Mo inchangée ; au-delà de 50 Mo environ, il faudra un upload direct vers S3 par URL signée (le serveur charge aujourd'hui le fichier en mémoire).
- **Accès** : un fichier de message se lit selon l'accès à sa conversation (voir [Droits et visibilité](#droits-et-visibilité)) et ne se supprime jamais par l'application (voir l'exception des cascades ci-dessus). `isOrphan` reconnaît `messageId` : sans ça, un fichier de message serait considéré comme orphelin, donc lisible et supprimable par tous.

**Preuve**

Un **faisceau d'indices** : journal en ajout seul, horodatage serveur, empreinte des fichiers, accusés de lecture, trace des mails chez un tiers (Brevo). Ce n'est **pas** un horodatage qualifié eIDAS ; s'il devient un besoin réglementaire, le pattern de Démarches Numériques (empreintes du jour horodatées chaque nuit par un tiers qualifié) se branchera en plus.

**Conservation**

Les échanges et les pièces sont des **archives publiques** (Code du patrimoine, L211-4). Leur durée de conservation est à définir avec la mission archives (durée d'utilité administrative et sort final), et aucune élimination n'est possible sans son visa. En attendant, la durée déclarée au DataPass de Bhasile s'applique (15 ans, à vérifier), et aucune purge n'est implémentée. Les messages peuvent contenir des données nominatives (salariés, demandeurs d'asile) : le tableau de gestion et une analyse d'impact (AIPD, avec le DPO) sont à établir avant la mise en service.

**Mise en prod**

- Tout part en prod au fil des PR ; avant la mise en service, seuls les superadmins voient les échanges, en lecture seule. La porte est `MESSAGERIE_ENABLED`, lue dans `canAccessTarification` : tant qu'elle ne vaut pas `true`, les agents et les opérateurs n'ont accès ni à la page, ni à l'API, ni aux fichiers des échanges. Une variable absente ferme l'accès. Elle vaut `true` en local et en staging.
- Les crons ne tournent qu'en prod (`scripts/cron.sh`) : la reprise des notifications se recette en préprod.

## Interface

La messagerie est livrée avant la gestion des documents, avec une page minimale de tarification, sans documents.

**Livré**

- **Page** `/structures/[id]/tarification/[year]`, hors navigation principale. `/structures/[id]/tarification` redirige vers la campagne de l'année en cours. Le bouton « Tarification » de l'en-tête de la fiche n'apparaît qu'à qui a accès.
- **Sélecteur de campagne** : les campagnes ouvertes et les campagnes passées qui ont une tarification, de la plus récente à la plus ancienne. Une autre année donne une page introuvable.
- **Deux onglets** : « Tout le monde » (conversation partagée) et « Services de l'État seulement » (conversation agents), absent pour l'opérateur. L'onglet est dans l'URL (`?canal=agents`), pour que les liens des mails ouvrent le bon canal ; un opérateur est toujours ramené au canal partagé.
- **Un fil chronologique** : auteur, niveau (DDETS, DREETS, Opérateur), date et heure de Paris, « Lu par » ; on écrit toujours à la suite (« Écrivez un message »). Texte brut, retours à la ligne conservés.
- **Envoi sans affichage optimiste** : le message n'apparaît qu'une fois accepté par le serveur. Le journal fait preuve : il n'affiche jamais un message que le serveur aurait refusé.
- **Pièces jointes** : bouton « Joindre des fichiers » (plusieurs à la fois), envoi de chaque fichier dès qu'il est choisi, puis rattachement par clé à l'envoi du message. Affichées dans le fil sous leur message (nom, format, taille), ouvertes par un lien signé demandé au clic ; elles n'apparaissent pas dans la navigation dans les documents.
  - Validation par le serveur seulement, comme dans le reste de l'application : un fichier refusé affiche le message du serveur, et « Envoyer » reste désactivé tant qu'un fichier est en cours d'envoi ou en erreur (pas de « ci-joint » sans la pièce).
  - Retirer une pièce jointe supprime le fichier ; un fichier retiré pendant son envoi est supprimé à son arrivée. Une saisie abandonnée laisse des fichiers orphelins (voir [Évolutions possibles](#évolutions-possibles)).
  - Un envoi refusé garde le texte et les pièces jointes ; un envoi accepté les vide sans supprimer les fichiers, désormais rattachés.
- **Lecture seule** affichée en bandeau, à la place de la saisie : campagne close, ou superadmin.

**À venir**

- **Tags** : sélecteur à l'écriture et modification sur place, pour les agents ; badge sur le message.
- **Avec la gestion des documents** : le panneau « Échanges » passe en surcouche, ouvert par un bouton flottant, par-dessus la navigation dans les documents ; le sommaire (ancres et pièces jointes, pour sauter à un moment du fil) et le filtre par phase arrivent avec les ancres ; le sélecteur de tag est prérempli avec la phase en cours.

## Implémentation

| Brique                           | Où                                                                                                                                     | État    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Modèle et squelette tarification | `prisma/schema/conversation.prisma`, `prisma/schema/tarification.prisma`                                                               | fait    |
| Messagerie (agnostique)          | `src/app/api/conversations/` : `conversation.service.ts`, `conversation.repository.ts`, `conversation.util.ts`                         | fait    |
| Branchement tarification         | `src/app/api/tarifications/` : tags (`tarification.constants.ts`), fenêtre de campagne (`tarification.util.ts`), droits et participant | fait    |
| Routes                           | `GET`/`POST /api/tarifications/[structureId]/[year]/messages`, `POST …/messages/read`, `PATCH /api/tarifications/messages/[messageId]` | fait    |
| Droits                           | `src/lib/casl/tarification.ability.ts` : `canAccessTarification`, `canReadConversation`                                                | fait    |
| Pièces jointes                   | `FileUpload.messageId`, `src/app/api/files/file.service.ts` (`isOrphan`, `authorizeFileAccess`)                                        | fait    |
| Porte de mise en service         | `MESSAGERIE_ENABLED` dans `canAccessTarification`                                                                                      | fait    |
| Interface : page et fil          | `src/app/(authenticated)/structures/[id]/tarification/`, `src/hooks/useConversationMessages.ts`                                        | fait    |
| Interface : pièces jointes       | `src/hooks/useMessageAttachments.ts`, `AttachmentChip`, `MessageAttachment`                                                            | fait    |
| Interface : tags                 | sélecteur, badge, modification                                                                                                         | à faire |
| Notifications                    | `MessageNotification`, `StructureSubscription`, Brevo transactionnel, cron de reprise, webhook des rebonds, compteur de non-lus        | à faire |
| Triggers d'ajout seul            | migration dédiée                                                                                                                       | à faire |
| Empreinte SHA-256                | `FileUpload.sha256`                                                                                                                    | à faire |

## Évolutions possibles

| Évolution                                                                        | Comment                                                                      |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Répondre directement sous un message, hors du flux de la conversation            | À concevoir le jour venu.                                                    |
| Date de réponse attendue sur un message (« réponse attendue avant le … »)        | Colonne nullable sur `Message`, indicateur dans le bloc dashboard.           |
| Regroupement des mails (un résumé plutôt que cinq mails en une minute)           | Le cron regroupe par destinataire les messages encore sans trace d'envoi.    |
| Marquer comme non lu                                                             | Préférence modifiable, à part des accusés de lecture.                        |
| Recherche par mot-clé dans les échanges                                          | Recherche plein texte PostgreSQL sur le texte des messages.                  |
| Ménage des fichiers orphelins (envoyés puis abandonnés avant l'envoi du message) | Tâche périodique : supprimer les fichiers sans rattachement de plus de 24 h. |
| Temps réel poussé                                                                | SSE + `LISTEN/NOTIFY`, sans changer le modèle.                               |
| Horodatage qualifié (si besoin réglementaire)                                    | Tâche quotidienne : empreintes du jour horodatées par un tiers qualifié.     |
