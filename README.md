# Bot Discord de réaction aux messages dans les threads

Ce bot Discord simple permet de répondre aux messages dans les threads et d'interagir avec les utilisateurs.

## Configuration

1. Assurez-vous d'avoir Node.js installé sur votre système
2. Installez les dépendances avec `npm install`
3. Configurez votre fichier `.env` avec votre token Discord:
   ```
   CLIENT_TOKEN=votre_token_discord_ici
   ```
4. Démarrez le bot avec `node index.js`

## Fonctionnalités

- Système de modération automatique :
  - Suppression des messages sans média après 5 minutes
  - Exemption des modérateurs et messages épinglés
- Gestion des threads :
  - Vérification quotidienne des threads non verrouillés
  - Fermeture automatique après 7 jours d'inactivité
- Réaction 🏆 aux messages répondant aux critères
- Commande !ping pour vérifier la latence

## Configuration requise

Variables d'environnement :
- `CLIENT_TOKEN`: Token d'authentification du bot Discord
- `CHANNEL_ID`: ID du canal surveillé
- `REACT_EMOJI`: Emoji utilisé pour les réactions (par défaut: 🏆)

Versions :
- Node.js v18.16.0
- Discord.js v14.18.0
- Intents nécessaires : `Guilds`, `GuildMessages`, `MessageContent`

## Dépannage

Si vous rencontrez des problèmes:

1. Vérifiez les variables d'environnement et leurs permissions
2. Vérifiez les droits du bot sur le canal spécifié
3. Assurez-vous que le bot peut gérer les threads
4. Vérifiez la version de Node.js et des dépendances
5. Confirmez l'activation des intents privilégiés sur le portail Discord