require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
  
  client.on('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
    console.log(`Surveillance du canal ID: ${process.env.CHANNEL_ID}`);
    console.log(`Réaction configurée: ${process.env.REACT_EMOJI}`);
    
    // Lister les messages récents du fil au démarrage
    listThreadMessages();
  });
  
  client.on(Events.MessageCreate, async (message) => {
    // Commande ping pour tester que le bot fonctionne
    if (message.content === '!ping') {
      message.reply('Pong! 🏓');
      return;
    }
    
    // Vérifier si le message est dans le canal spécifié
    if (message.channelId === process.env.CHANNEL_ID && message.attachments.size === 0 && message.embeds.length === 0 && message.member && !message.member.roles.cache.some(role => role.name === 'Modérateur')) {
      console.log(`Message texte sans média détecté: ${message.content}`);
      
      try {
        // Supprimer le message texte
        await message.delete();
        console.log('Message texte supprimé avec succès');
      } catch (error) {
        console.error("Erreur lors de la suppression du message:", error);
      }
    }
    else if (message.channelId === process.env.CHANNEL_ID && (message.attachments.size > 0 || message.embeds.length > 0) && message.member) {
      console.log(`Nouveau message avec média dans le fil: ${message.content}`);
      
      try {
        // Ajouter la réaction au message
        await message.react(process.env.REACT_EMOJI);
        console.log(`Réaction ${process.env.REACT_EMOJI} ajoutée au message`);
      } catch (error) {
        console.error("Erreur lors de l'ajout de la réaction:", error);
      }
    }
  });
  
  // Fonction pour lister les messages récents du fil
  async function listThreadMessages() {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      if (!channel) {
        console.error('Canal non trouvé');
        return;
      }
      
      console.log(`Surveillance du canal: ${channel.name}`);
      
      // Récupérer les messages récents
      const messages = await channel.messages.fetch({ limit: 10 });
      console.log(`${messages.size} messages récents trouvés dans le fil`);
      
      messages.forEach(msg => {
        console.log(`- ${msg.author.username}: ${msg.content}`);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  }
  
  client.login(process.env.CLIENT_TOKEN);