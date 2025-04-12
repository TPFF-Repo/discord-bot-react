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

- Répond "Pong! 🏓" lorsqu'un utilisateur envoie "!ping"
- Prêt à être étendu avec d'autres commandes et fonctionnalités

## Notes techniques

- Utilise Discord.js v14.18.0
- Configuré avec les intents nécessaires pour lire les messages et interagir avec les guildes
- Nécessite l'intent `MessageContent` pour lire le contenu des messages (privilégié dans l'API Discord)

## Dépannage

Si vous rencontrez des problèmes:

1. Vérifiez que votre token est correct dans le fichier `.env`
2. Assurez-vous que votre bot a les permissions nécessaires dans Discord
3. Vérifiez que vous avez activé les intents privilégiés dans le portail développeur Discord