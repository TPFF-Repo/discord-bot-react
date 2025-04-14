const { Events } = require('discord.js');

/**
 * Module de modération du canal Screenshot
 * @module screenshot
 * @param {Client} client - Instance du client Discord
 * @description Gère la modération des messages dans le canal dédié aux captures d'écran :
 * - Supprime les messages textuels sans média des non-moderateurs
 * - Envoie des notifications aux utilisateurs
 * - Gère les erreurs de suppression
 */
module.exports = {
  /**
   * Configure l'écouteur de messages pour le canal Screenshot
   * @method setup
   * @param {Client} client - Client Discord.js
   * @returns {void}
   */
  setup: (client) => {
    client.on(Events.MessageCreate, async (message) => {
      if (message.channelId !== process.env.CHANNEL_SCREENSHOT_ID) return;

      const member = message.member;
      if (!member) return;

      // Vérification des médias et rôle modérateur
      const hasMedia = message.attachments.size > 0 || message.embeds.length > 0;
      const isModerator = member.roles.cache.some(role => role.name === 'Modérateur');

      if (!hasMedia && !isModerator) {
        try {
          await message.author.send("Votre message texte a été supprimé car ce canal est réservé aux captures d'écran.");
          await message.delete();
        } catch (error) {
          /**
           * Gestion des erreurs de suppression
           * @throws {Error} Enregistre les erreurs dans la console
           */
          console.error('Erreur modération screenshot:', error);
        }
      }
    });
  }
};