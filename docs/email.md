# Emails

Les mails que Bhasile envoie aux utilisateurs pour les prévenir d'un événement (nouveau message, plus tard document partagé, relecture demandée). Ce document décrit le mécanisme commun ; chaque feature décrit sa politique : qui est notifié, de quoi, avec quel template.

| Feature    | Événements notifiés | Politique                                    |
| ---------- | ------------------- | -------------------------------------------- |
| Messagerie | Nouveau message     | [Notifications](messagerie.md#notifications) |

Sans rapport avec le modèle `Notification`, qui porte les bandeaux affichés dans l'application.

## Principes

- **Le mail est une notification, jamais un contenu** : un lien vers l'écran concerné et le contexte qui permet de le trier (structure, campagne, auteur). Ni texte métier, ni pièce jointe : un mail se transfère, et les boîtes sont limitées.
- **Liste blanche** : chaque type d'événement d'une feature déclare s'il notifie ; un nouveau type ne notifie pas par défaut.
- **Au moins une fois** : le mécanisme peut signaler deux fois un même événement (arrêt du cron entre l'envoi et la trace), jamais en perdre un sans alerte.

## Brevo transactionnel

- **Client** : `sendTemplateEmail` (`src/lib/brevo.ts`), un appel `POST /v3/smtp/email` **par destinataire**, avec un timeout de 10 s. Un appel groupé ne garantit pas l'ordre des identifiants renvoyés, et une seule adresse refusée y bloquerait tous les autres destinataires.
- **Template** : le texte, la mise en page et l'expéditeur vivent dans Brevo, un template par type de mail, son identifiant en variable d'environnement. La feature calcule les paramètres, dont les liens, dans le code, où ils sont testés ; une liste se parcourt dans le template (`{% for conversation in params.conversations %}`).
- **Trace chez un tiers** : l'identifiant Brevo de chaque mail accepté est conservé ; c'est lui qui reliera un rebond (webhook) aux événements que le mail signalait.
- **Activation** : sans `BREVO_API_KEY` ou sans l'identifiant du template, rien n'est envoyé, tracé ni abandonné. Hors prod, l'envoi est réel : les comptes du seed (`@test.proconnect.gouv.fr`) n'ont pas de boîte ; pour recetter, y mettre des adresses d'équipe.

## Envoi et reprise

- **Pas de file de tâches** : l'absence de trace d'envoi d'un événement vaut « à notifier » (une _outbox_ implicite).
- **Un mail groupé, pas d'envoi immédiat** : un cron passe deux fois par jour (7 h et 13 h UTC, soit 8 h et 14 h à Paris l'hiver, 9 h et 15 h l'été) et envoie à chaque destinataire un seul mail pour tous ses événements en attente. Une rafale donne un mail ; un événement déjà vu dans l'application entre-temps n'est pas signalé.
- **Trace par destinataire** : chaque mail accepté écrit une ligne par événement qu'il signale ; la trace de l'événement n'est écrite que si aucun de ses destinataires n'a échoué, même vide quand personne n'était à notifier. Le passage suivant reprend donc les seuls destinataires restants.
- **Échec et abandon** : un envoi en échec est repris au passage suivant ; au-delà de 3 jours sans trace, l'événement est abandonné (trace avec date d'abandon). Dans les deux cas le script sort en erreur : `scripts/cron.sh` remonte alors l'échec au moniteur Sentry du cron, qui porte le nom du script. Les crons ne tournent qu'en prod : l'envoi se recette en lançant le script à la main.

## À venir

- **Rebonds** (contact parti, boîte supprimée) : webhook Brevo, tracés en ajout seul à côté de l'événement, visibles des agents. Le webhook est une URL publique, à authentifier.
- **Suivre ou ne plus suivre une structure** (`StructureSubscription`, qui ne stocke que les écarts au défaut), avec la tarification : une DREETS peut suivre une structure sensible ; un agent de DDETS, ne plus suivre celles qu'un collègue gère. Le suivi vaut pour toutes les features. D'ici là, pas de désabonnement.

## Variables d'environnement

| Variable                    | Rôle                                                |
| --------------------------- | --------------------------------------------------- |
| `BREVO_API_KEY`             | Clé API Brevo (aussi utilisée pour les contacts)    |
| `BREVO_MESSAGE_TEMPLATE_ID` | Template des notifications de message ; vide = rien |
| `NEXT_URL`                  | Base des liens des mails                            |
