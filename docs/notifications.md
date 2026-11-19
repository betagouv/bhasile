# Notifications

La cloche signale dans l'application ce qui attend l'utilisateur, à côté des [mails](email.md), qui le signalent hors de l'application. Ce document décrit le mécanisme commun ; chaque feature décrit sa politique : quels faits, pour qui.

| Feature      | Ce que signale la cloche                              | Politique                                      |
| ------------ | ----------------------------------------------------- | ---------------------------------------------- |
| Tarification | Dépôts, partages, relectures, contestations, retraits | [Notifications](tarification.md#notifications) |
| Messagerie   | Conversations ayant des messages non lus              | [Notifications](messagerie.md#notifications)   |

## Principes

- **Une politique, deux canaux** : la cloche et le mail signalent les mêmes faits aux mêmes destinataires, à une exception près : la cloche ne signale jamais un fait à son auteur. Le mail peut le faire quand il sert de preuve hors de Bhasile (accusé de dépôt).
- **Une seule règle de destinataires par feature**, une fonction pure que les deux canaux appellent : le mail en partant d'un fait pour trouver ses destinataires, la cloche en partant d'un utilisateur pour trouver ses faits. Pour la tarification, `isNotificationRecipient(recipient, event, journal, readEventIds)` à côté du registre, qui garde son booléen `notifies` (liste blanche) ; pour la messagerie, la règle de `getMessageRecipients` (grants `REGION` exclus). Un test par ligne du tableau de la politique.
- **Calculée à la lecture** : aucune notification n'est stockée. La cloche croise, à chaque affichage, les faits du journal et les messages avec la politique et les droits du moment. Un utilisateur qui reçoit un droit voit tous les faits non traités de son nouveau périmètre (postérieurs à la création de son compte) ; celui qui le perd ne les voit plus. Rien n'est écrit au moment du fait : ni les écritures, ni le seed, ni les scripts de reprise n'ont à s'en soucier.
- **Seuls les états de l'utilisateur sont stockés** : ce qu'il a vu, ce qu'il a traité. Ce sont des états d'affichage, sans valeur de preuve, contrairement aux accusés de lecture des messages et aux ouvertures de documents, auxquels la cloche n'écrit jamais.
- **Par utilisateur** : un fait traité par un collègue reste dans la cloche des autres destinataires. Le suivi des structures (`StructureSubscription`, à venir) réduira les destinataires, pas l'état.

## Vu et traité

| État   | Ce qu'il signifie                                    | Stockage                                                                    | Effet                                                   |
| ------ | ---------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| Vu     | La cloche a été ouverte depuis l'arrivée de la ligne | `User.notificationSeenAt` (nullable : jamais ouverte)                       | La ligne n'est plus en gras ni comptée dans la pastille |
| Traité | L'utilisateur est allé voir                          | `NotificationRead(userId, tarificationEventId)`, écrit au clic sur la ligne | La ligne disparaît                                      |

- **Le repère vaut la date de la ligne la plus récente affichée**, pas l'heure de l'ouverture : une ligne arrivée entre le chargement du panneau et sa fermeture ne doit pas passer pour vue. Le client l'envoie, le serveur ne le laisse ni reculer ni dépasser l'horloge de la base : `GREATEST(COALESCE("notificationSeenAt", '-infinity'), LEAST($1, clock_timestamp()))`. Jamais `getNow()`, émulée en recette alors que les dates du journal viennent de la base. Reste un décalage assumé : `createdAt` est l'heure de début de la transaction qui écrit le fait, et un fait commité juste après le chargement peut être daté juste avant ; il reste dans la liste, sans compter dans la pastille.
- **Un fait est traité au clic** sur sa ligne, qui mène à l'étape concernée (`?etape=`), ou à la page de la campagne si le fait n'a pas d'étape (pièce justificative, autre document). Un fait vu par un autre chemin (fiche, lien d'un mail) reste dans la cloche jusqu'au clic : la cloche n'infère pas, elle observe le geste qui la concerne.
- **Une conversation est traitée quand ses messages sont lus**, par les accusés de lecture existants : le clic ouvre le tiroir des échanges (`?canal=`), qui les écrit. Lire les messages par un autre chemin la fait aussi disparaître. La cloche n'écrit jamais d'accusé : ils s'affichent aux autres (« Lu par ») et font preuve.
- **La pastille** compte les lignes arrivées après `notificationSeenAt` : un fait par sa date, une conversation par celle de son dernier message non lu. Ouvrir la cloche la remet à zéro, sans rien traiter.
- **Pas de « tout marquer comme lu »** : chaque ligne se traite à l'unité. Voir [Évolutions possibles](#évolutions-possibles).

## Liste

- **Plate, du plus récent au plus ancien**, sans regroupement ; les lignes arrivées depuis la dernière ouverture sont en gras, avec un « nouveau » lisible par les lecteurs d'écran.
- **Une ligne par fait**, une ligne par conversation (« 3 nouveaux messages · Tout le monde »).
- **Contenu** : le libellé du fait et le document (« Dépôt : CA 2025 », jamais le nom du fichier), la structure et son département, le niveau de l'auteur (DDETS, DREETS, Opérateur), la date à l'heure du département de la structure.
- **Conversations** : celles dont l'utilisateur est destinataire selon la règle de la messagerie (la DREETS n'en a pas), et qui ont des messages non lus. Même compte que le tiroir des échanges, sans autre borne.
- **Faits** : seuls ceux postérieurs à `User.createdAt` apparaissent ; la colonne existe déjà. Un compte créé en cours de campagne ne reçoit pas l'historique, qu'il retrouve dans le journal de chaque structure.
- **Pas de fenêtre de temps** : une ligne reste tant qu'elle n'est pas traitée. Plafond connu : un utilisateur d'un gros opérateur qui ne clique jamais accumulerait des milliers de lignes, toutes relues à chaque ouverture. Si ça arrive, un repère `notificationReadUntil` (« tout ce qui précède est traité ») ou une fenêtre pourrait borner la requête, sans toucher au reste.

## Lecture

- **Groupée par périmètre**, pas structure par structure : le journal complet d'une structure (`getTarificationJournal`) chargerait toutes les campagnes de toutes les structures à chaque ouverture. La cloche traduit les droits de l'utilisateur en filtre (structures accessibles, opérateur), puis lit en une requête les seuls événements notifiables, avec ce que la politique et la visibilité demandent (statut et types du document, niveau de l'auteur, partage et retrait du même document). Les règles ne visent l'opérateur que pour des faits qu'il voit (partage, retrait d'un document partagé). C'est la seule lecture du journal hors de `getTarificationJournal` (voir [Droits et visibilité](tarification.md#droits-et-visibilité)).
- **La pastille ne lit que ce qui est postérieur à `notificationSeenAt`** (`TarificationEvent.createdAt`, indexé ; les messages passent par l'index de leur conversation) : son coût ne grossit pas avec l'historique. Le contexte des règles (dépôts, partages, retraits) n'est chargé que pour les tarifications qui ont un fait à signaler.
- **Bornée au profil** : seuls les types de faits que l'utilisateur peut recevoir sont lus (`getReceivableEventTypes`, à côté du prédicat) : une DREETS ne lit que les contestations et les relectures de ses versions, et pas les conversations. **Aucune lecture du journal ni des conversations** pour un utilisateur sans accès à la tarification (superadmin, grant national, lecteur seul) : pas de cloche.

## Écran

- **Une cloche sur le tableau de bord**, à côté du titre, avec sa pastille ; elle ouvre un panneau déroulant. Ailleurs, pas de cloche pour l'instant : l'emplacement définitif viendra avec la maquette, comme les pastilles par étape dans la page tarification.
- **Fraîcheur**, sur le modèle du [temps réel des échanges](messagerie.md#lectures-non-lus-et-temps-réel) :
  - le serveur ne décide que de l'affichage de la cloche ; la pastille est chargée dès l'affichage, puis relue toutes les 60 secondes (`setTimeout` chaîné), en pause quand l'onglet est caché, relue tout de suite à son retour et après l'ouverture du panneau. Un agent qui garde Bhasile ouvert la voit bouger, et le retour arrière, qui réaffiche la page en cache, la relit aussi ;
  - la liste est chargée à l'ouverture du panneau, jamais rendue avec la page : au retour arrière, Next réutilise la page en cache, qui montrerait des lignes déjà traitées ;
  - la ligne cliquée disparaît tout de suite, sans attendre la relecture.
- **Panneau** : motif _disclosure_ (WAI-ARIA) : un bouton avec `aria-expanded` et `aria-controls`, pas de `role="menu"` ; Échap ferme et rend le focus au bouton. Le nombre est dans le libellé du bouton (« Notifications, 3 nouvelles »), « 99+ » au-delà. Le DSFR n'a pas de cloche : un bouton tertiaire avec icône et pastille. Le défilement de la page le referme : l'en-tête qui le porte se cache.
- **Échecs** : si la liste ne se charge pas, une alerte dans le panneau, et le repère n'avance pas ; il n'avance pas non plus si le panneau est refermé avant l'arrivée de la liste. Si la pastille ne se relit pas, elle garde sa dernière valeur.
- **Porte** : celle de la tarification, `MESSAGERIE_ENABLED` ; sans elle, pas de cloche.

## API

| Route                           | Effet                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/notifications`        | La liste, avec pour chaque ligne sa clé (fait ou conversation), sa date, son libellé, sa structure, son lien, `isNew`                |
| `GET /api/notifications/count`  | Le nombre de lignes postérieures au repère                                                                                           |
| `PUT /api/notifications/seen`   | `{ seenUntil }` : avance le repère (voir [Vu et traité](#vu-et-traité))                                                              |
| `POST /api/notifications/reads` | `{ eventId }` : écrit la lecture, idempotent (`skipDuplicates`) ; 204, ou 404 si le fait n'est pas une notification de l'utilisateur |

- **`NotificationRead`** : clé `(userId, tarificationEventId)`, index sur `tarificationEventId` (le mail lit par fait), `createdAt`, suppression restreinte comme le journal.
- **Le clic n'attend pas la réponse** pour naviguer (`fetch` avec `keepalive`, qui survit au changement de page) : un échec laisse la ligne en place, sans autre conséquence.

## Avec les mails

- **Un fait traité dans la cloche avant le passage du cron n'est pas envoyé par mail**, sauf l'accusé de dépôt, qui sert de preuve. Le digest lit `NotificationRead` en plus de sa file. C'est la règle « déjà vu dans l'application » des [mails](email.md#envoi-et-reprise).
- **Un mail envoyé ne traite rien dans la cloche** : on ne sait pas s'il a été lu.
- **Le suivi d'une structure** (`StructureSubscription`, à venir) changera les destinataires des deux canaux à la fois.

## Questions ouvertes

- **Opérateurs** : accèdent-ils au tableau de bord, et la cloche d'une mère regroupe-t-elle ses filiales ? À trancher avec le chantier des droits (voir [Permissions](permissions.md)).

## Évolutions possibles

| Évolution                                           | Comment                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tout marquer comme lu                               | Repère `User.notificationReadUntil` : une écriture ; une ligne est traitée si elle le précède ou a sa lecture |
| Cloche sur toutes les pages                         | Dans le menu ou un en-tête global, avec la même relecture côté client                                         |
| Pastilles par étape dans la page tarification       | État « vu » par utilisateur et par étape, avec la maquette                                                    |
| Autre source de faits (transformations, anomalies…) | Une colonne de plus sur `NotificationRead` et un `CHECK` (une seule cible par ligne)                          |
| Lien d'un mail qui traite la notification           | Le lien porte l'identifiant du fait, la page écrit la lecture                                                 |
| Temps réel poussé                                   | SSE et `LISTEN/NOTIFY`, comme pour les échanges, sans changer le modèle                                       |
