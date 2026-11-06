# Notifications

La cloche signale dans l'application ce qui attend l'utilisateur, à côté des [mails](email.md), qui le signalent hors de l'application. Ce document décrit le mécanisme commun ; chaque feature décrit sa politique : quels faits, pour qui.

| Feature      | Ce que signale la cloche                              | Politique                                      |
| ------------ | ----------------------------------------------------- | ---------------------------------------------- |
| Tarification | Dépôts, partages, relectures, contestations, retraits | [Notifications](tarification.md#notifications) |
| Messagerie   | Conversations ayant des messages non lus              | [Notifications](messagerie.md#notifications)   |

## Principes

- **Une politique, deux canaux** : la cloche et le mail signalent les mêmes faits aux mêmes destinataires, à une exception près : la cloche ne signale jamais un fait à son auteur. Le mail peut le faire quand il sert de preuve hors de Bhasile (accusé de dépôt).
- **Calculée à la lecture** : aucune notification n'est stockée. La cloche croise, à chaque affichage, les faits du journal et les messages avec la politique et les droits du moment. Un utilisateur qui reçoit un droit voit les faits en cours ; celui qui le perd ne les voit plus. Rien n'est écrit au moment du fait : ni les écritures, ni le seed, ni les scripts de reprise n'ont à s'en soucier.
- **Seuls les états de l'utilisateur sont stockés** : ce qu'il a vu, ce qu'il a traité. Ce sont des états d'affichage, sans valeur de preuve, contrairement aux accusés de lecture des messages et aux ouvertures de documents, auxquels la cloche n'écrit jamais.
- **Liste blanche** : celle de la feature, la même que pour les mails ; un nouveau type de fait ne notifie pas par défaut.

## Vu et traité

| État   | Ce qu'il signifie                                    | Stockage                                                                    | Effet                                                   |
| ------ | ---------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| Vu     | La cloche a été ouverte depuis l'arrivée de la ligne | `User.notificationSeenAt`, avancé à `now()` à chaque ouverture de la cloche | La ligne n'est plus en gras ni comptée dans la pastille |
| Traité | L'utilisateur est allé voir                          | `NotificationRead(userId, tarificationEventId)`, écrit au clic sur la ligne | La ligne disparaît                                      |

- **Un fait est traité au clic** sur sa ligne, qui mène à l'étape concernée (`?etape=`). Un fait vu par un autre chemin (fiche, lien d'un mail) reste dans la cloche jusqu'au clic : la cloche n'infère pas, elle observe le geste qui la concerne.
- **Une conversation est traitée quand ses messages sont lus**, par les accusés de lecture existants : le clic ouvre le tiroir des échanges (`?canal=`), qui les écrit. Lire les messages par un autre chemin la fait aussi disparaître. La cloche n'écrit jamais d'accusé : ils s'affichent aux autres (« Lu par ») et font preuve.
- **La pastille** compte les lignes arrivées après `notificationSeenAt` : un fait par sa date, une conversation par celle de son dernier message non lu. Ouvrir la cloche la remet à zéro, sans rien traiter.
- **Pas de « tout marquer comme lu »** : chaque ligne se traite à l'unité. Voir [Évolutions possibles](#évolutions-possibles).

## Liste

- **Plate, du plus récent au plus ancien**, sans regroupement ; les lignes arrivées depuis la dernière ouverture sont en gras.
- **Une ligne par fait**, une ligne par conversation (« 3 nouveaux messages · canal partagé »).
- **Contenu** : le libellé du fait et le document (« Dépôt : CA 2025 », jamais le nom du fichier), la structure et son département, le niveau de l'auteur (DDETS, DREETS, Opérateur), la date à l'heure du département de la structure.
- **Borne** : seuls les faits et les messages postérieurs à `User.createdAt` apparaissent ; la colonne existe déjà. Un compte créé en cours de campagne ne reçoit pas l'historique, qu'il retrouve dans le journal de chaque structure.
- **Pas de fenêtre de temps** : une ligne reste tant qu'elle n'est pas traitée. Plafond connu : un utilisateur d'un gros opérateur qui ne clique jamais accumulerait des milliers de lignes, toutes relues à chaque affichage. Si ça arrive, un repère `notificationReadUntil` (« tout ce qui précède est traité ») ou une fenêtre pourrait borner la requête, sans toucher au reste.

## Écran

- **Une cloche sur le tableau de bord**, à côté du titre, avec sa pastille ; elle ouvre un panneau déroulant. Le tableau de bord est rendu par le serveur à chaque navigation : la pastille est à jour à chaque arrivée sur la page, sans polling.
- **Ailleurs**, pas de cloche pour l'instant : l'emplacement définitif viendra avec la maquette, comme les pastilles par étape dans la page tarification.
- **Porte** : celle de la tarification, `MESSAGERIE_ENABLED` ; sans elle, pas de cloche.
- **Superadmins** : pas de cloche, ils ne sont jamais notifiés.

## Écritures

| Route                           | Effet                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `PUT /api/notifications/seen`   | `notificationSeenAt = now()`, à l'ouverture du panneau                                       |
| `POST /api/notifications/reads` | `{ eventId }` : écrit la lecture, idempotent ; refusé si l'utilisateur n'a pas accès au fait |

Le clic n'attend pas la réponse pour naviguer : un échec laisse la ligne en place, sans autre conséquence.

## Avec les mails

- **Un fait traité dans la cloche avant le passage du cron n'est pas envoyé par mail**, sauf l'accusé de dépôt, qui sert de preuve. Le digest lit `NotificationRead` en plus de sa file. C'est la règle « déjà vu dans l'application » des [mails](email.md#envoi-et-reprise).
- **Un mail envoyé ne traite rien dans la cloche** : on ne sait pas s'il a été lu.
- **Le suivi d'une structure** (`StructureSubscription`, à venir) changera les destinataires des deux canaux à la fois.

## Évolutions possibles

| Évolution                                           | Comment                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tout marquer comme lu                               | Repère `User.notificationReadUntil` : une écriture ; une ligne est traitée si elle le précède ou a sa lecture |
| Cloche sur toutes les pages                         | Dans le menu ou un en-tête global ; la pastille, dans un layout, demandera un chargement côté client          |
| Pastilles par étape dans la page tarification       | État « vu » par utilisateur et par étape, avec la maquette                                                    |
| Autre source de faits (transformations, anomalies…) | Une colonne de plus sur `NotificationRead` et un `CHECK` (une seule cible par ligne)                          |
| Lien d'un mail qui traite la notification           | Le lien porte l'identifiant du fait, la page écrit la lecture                                                 |
