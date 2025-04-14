const { Events } = require('discord.js');
const threadHandlers = new WeakMap();

/**
 * Module de gestion des threads
 * @module threads
 * @param {Client} client - Instance du client Discord
 * @description Gère le cycle de vie des threads :
 * - Création et configuration des nouveaux threads
 * - Surveillance de l'activité et verrouillage automatique
 * - Modération des messages selon les règles établies
 */
module.exports = {
    /**
   * Configure les écouteurs d'événements pour les threads
   * @method setup
   * @param {Client} client - Client Discord.js
   * @returns {void}
   */
  setup: (client) => {
        // Événement de création de thread
    client.on(Events.ThreadCreate, (thread) => {
      if (thread.parentId === process.env.CHANNEL_CONCOUR_ID) {
        console.log(`Nouveau thread détecté: ${thread.name}`);
        applyThreadRules(thread);
      }
    });

        // Événement de mise à jour de thread
    client.on(Events.ThreadUpdate, (oldThread, newThread) => {
      if (oldThread.locked && !newThread.locked) {
        console.log(`Thread déverrouillé détecté: ${newThread.name}`);
        applyThreadRules(newThread);
      } else if (!oldThread.locked && newThread.locked) {
        threadHandlers.delete(newThread);
        console.log(`Thread ${newThread.name} nettoyé`);
      }
    });

      /**
   * Applique les règles de gestion pour un thread
   * @param {ThreadChannel} thread - Le thread à configurer
   * @param {Date} createdAt - Timestamp de création du thread
   * @param {Date} lastActivity - Dernière activité détectée
   */
  function applyThreadRules(thread) {
      threadHandlers.set(thread, {
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }

    client.on(Events.MessageCreate, async (message) => {
      const thread = threadHandlers.get(message.channel);
      if (thread && !thread.locked) {
        handleMessage(message);
      }
    });

      /**
   * Gère la modération des messages dans les threads
   * @async
   * @param {Message} message - Message à analyser
   * @throws {Error} Log les erreurs de suppression de message
   * @description Vérifications effectuées :
   * - Présence de média dans le message
   * - Statut de modérateur de l'auteur
   * - Réaction aux messages valides
   */
  async function handleMessage(message) {
      if (message.content === '!ping') return;

      const member = message.member;
      if (!member) return;

      if (message.attachments.size === 0 && message.embeds.length === 0 && 
          !member.roles.cache.some(role => role.name === 'Modérateur')) {
        try {
          await message.author.send('Votre message texte a été supprimé car il ne contient pas de média.');
          await message.delete();
        } catch (error) {
          console.error('Erreur suppression message:', error);
        }
      } else if (message.attachments.size > 0 || message.embeds.length > 0) {
        await message.react(process.env.REACT_EMOJI);
      }
    }
  }
};