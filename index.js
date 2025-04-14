require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
  
  client.once(Events.ClientReady, () => {
    console.log(`Connecté en tant que ${client.user.tag}!`);
    console.log(`Surveillance du canal ID: ${process.env.CHANNEL_CONCOUR_ID}`);
    console.log(`Réaction configurée: ${process.env.REACT_EMOJI}`);
    setInterval(listThreadMessages, 60000);
  });
  
  client.on(Events.ThreadCreate, (thread) => {
  if (thread.parentId === process.env.CHANNEL_CONCOUR_ID) {
    console.log(`Nouveau thread détecté: ${thread.name}`);
    applyThreadRules(thread);
  }
});

client.on(Events.ThreadUpdate, (oldThread, newThread) => {
  if (oldThread.locked && !newThread.locked) {
    console.log(`Thread déverrouillé détecté: ${newThread.name}`);
    applyThreadRules(newThread);
  } else if (!oldThread.locked && newThread.locked) {
    threadHandlers.delete(newThread);
    console.log(`Thread ${newThread.name} nettoyé`);
  }
});

client.on(Events.MessageCreate, async (message) => {
    // Commande ping pour tester que le bot fonctionne
    if (message.content === '!ping') {
      message.reply('Pong! 🏓');
      return;
    }
    
    // Vérifier si le message est dans le canal spécifié
    if ((message.channelId === process.env.CHANNEL_CONCOUR_ID || message.channelId === process.env.CHANNEL_SCREENSHOT_ID) && message.attachments.size === 0 && message.embeds.length === 0 && message.member && !message.member.roles.cache.some(role => role.name === 'Modérateur')) {
      console.log(`Message texte sans média détecté: ${message.content}`);
      
      try {
        // Supprimer le message texte
        await message.delete();
        console.log('Message texte supprimé avec succès');
      } catch (error) {
        console.error("Erreur lors de la suppression du message:", error);
      }
    }
    else if (message.channelId === process.env.CHANNEL_CONCOUR_ID && (message.attachments.size > 0 || message.embeds.length > 0) && message.member) {
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
      const parentChannel = await client.channels.fetch(process.env.CHANNEL_CONCOUR_ID);
      if (!parentChannel) {
        console.error('Canal parent non trouvé');
        return;
      }

      // Récupérer tous les threads actifs
      const activeThreads = await parentChannel.threads.fetchActive();
      console.log(`${activeThreads.threads.size} threads actifs trouvés`);

      // Filtrer les threads avec le tag 'En cours'
      const filteredThreads = activeThreads.threads.filter(thread => 
        !thread.locked
      );

      console.log(`${filteredThreads.size} threads avec le tag 'En cours'`);

      // Parcourir chaque thread filtré
      filteredThreads.forEach(async (thread) => {
        try {
          const messages = await thread.messages.fetch({ limit: 10 });
          console.log(`\nThread: ${thread.name} (${thread.id})`);
          console.log(`${messages.size} messages récents:`);

          messages.forEach(msg => {
            console.log(`- ${msg.author.username}: ${msg.content || 'Média uniquement'}`);
          });

          // Appliquer la logique de modération
          applyThreadRules(thread);
        } catch (error) {
          console.error(`Erreur dans le thread ${thread.name}:`, error);
        }
      });
    } catch (error) {
      console.error('Erreur générale:', error);
    }
  }

  const threadHandlers = new WeakMap();

client.setMaxListeners(20);

// Écouteur unique global
client.on(Events.MessageCreate, async (message) => {
  const thread = threadHandlers.get(message.channel);
  if (thread && !thread.locked) {
    handleMessage(message);
  }
});

function applyThreadRules(thread) {
  // Enregistrer le thread dans la WeakMap
  threadHandlers.set(thread, {
    createdAt: Date.now(),
    lastActivity: Date.now()
  });


}

// Écouteurs globaux pour les threads
client.on(Events.ThreadCreate, (thread) => {
  if (thread.parentId === process.env.CHANNEL_CONCOUR_ID) {
    console.log(`Nouveau thread détecté: ${thread.name}`);
    applyThreadRules(thread);
  }
});

client.on(Events.ThreadUpdate, (oldThread, newThread) => {
  if (oldThread.locked && !newThread.locked) {
    console.log(`Thread déverrouillé détecté: ${newThread.name}`);
    applyThreadRules(newThread);
  } else if (!oldThread.locked && newThread.locked) {
    threadHandlers.delete(newThread);
    console.log(`Thread ${newThread.name} nettoyé`);
  }
});

  async function handleMessage(message) {
    // Logique existante de gestion des messages
    if (message.content === '!ping') {
      message.reply('Pong! 🏓');
      return;
    }

    const member = message.member;
    if (!member) return;

    if (message.attachments.size === 0 && message.embeds.length === 0 && 
        !member.roles.cache.some(role => role.name === 'Modérateur')) {
      try {
        await message.author.send('Votre message texte a été supprimé car il ne contient pas de média. Veuillez respecter les règles du concours.');
        console.log('Message d\'avertissement envoyé à l\'utilisateur');
      } catch (dmError) {
        console.error('Erreur envoi MP:', dmError);
      }
      try {
        await message.delete();
        console.log('Message texte supprimé dans le thread');
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    } else if (message.attachments.size > 0 || message.embeds.length > 0) {
      try {
        await message.react(process.env.REACT_EMOJI);
        console.log('Réaction ajoutée dans le thread');
      } catch (error) {
        console.error('Erreur réaction:', error);
      }
    }
  }
  
  client.login(process.env.CLIENT_TOKEN);