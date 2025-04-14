const { Events } = require('discord.js');

/**
 * Module de gestion du concours
 * @module concours
 * @param {Client} client - Instance du client Discord
 * @description Gère la modération des messages dans le canal de concours :
 * - Supprime les messages textuels sans média
 * - Réagit avec l'emoji configuré aux messages valides
 * - Envoie des notifications aux utilisateurs
 */
module.exports = {
  /**
   * Configure les écouteurs d'événements
   * @param {Client} client - Client Discord.js
   */
  setup: (client) => {
    client.on(Events.MessageCreate, async (message) => {
      if (message.channelId !== process.env.CHANNEL_CONCOUR_ID) return;

      const member = message.member;
      if (!member) return;

      // Vérification des médias et rôle modérateur
      const hasMedia = message.attachments.size > 0 || message.embeds.length > 0;
      const isModerator = member.roles.cache.some(role => role.name === 'Modérateur');

      if (!hasMedia && !isModerator) {
        try {
          await message.author.send('Votre message texte a été supprimé car il ne contient pas de média. Veuillez respecter les règles du concours.');
          await message.delete();
        } catch (error) {
          console.error('Erreur modération concours:', error);
        }
      } else if (hasMedia) {
        try {
          console.log('[DEBUG] Entrée dans le bloc de réaction');
          console.log('Tentative de réaction pour message:', message.id, 'Emoji:', process.env.REACT_EMOJI);
          console.log('Permissions du bot:', message.guild.me.permissionsIn(message.channel).toArray());
          
          await message.react(process.env.REACT_EMOJI)
            .then(() => console.log('Réaction ajoutée avec succès'))
            .catch(err => console.error('Échec de la réaction:', err));
          
          console.log('[DEBUG] Vérification média:', {
            attachments: message.attachments.size,
            embeds: message.embeds.length
          });
        } catch (error) {
          console.error('Erreur réaction:', error);
        }
      }
    });
  }
};