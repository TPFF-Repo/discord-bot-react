const { Client, ThreadChannel } = require('discord.js');
const { TAG_ID_AVENIR, TAG_ID_PARTICIPATION, TAG_ID_VOTE, TAG_ID_TERMINE, MOD_ROLE_ID, REACT_EMOJI } = process.env;

class GestionConcours {
  /**
   * @constructor
   * @description Initialise le gestionnaire de concours avec le client Discord
   * @param {Client} client - Instance du client Discord.js
   */
  constructor(client) {
    this.client = client;
    
    this.client.on('messageReactionAdd', async (reaction) => {
      if (reaction.partial) await reaction.fetch();
      const message = reaction.message;
      
      if (message.channel.isThread() && 
          message.channel.parentId === process.env.CHANNEL_CONCOUR_ID &&
          await this.getPhaseCourante(message.channel) === this.phases.PARTICIPATION) {
        
        if (!message.member?.roles.cache.has(process.env.MOD_ROLE_ID)) {
          await reaction.remove();
          console.log(`[MODERATION] Réaction ${reaction.emoji.name} supprimée du message ${message.id}`);
        }
      }
    });

    this.phases = {
      A_VENIR: TAG_ID_AVENIR,
      PARTICIPATION: TAG_ID_PARTICIPATION,
      VOTE: TAG_ID_VOTE,
      TERMINE: TAG_ID_TERMINE
    };
  }

  /**
   * @method verifierMessage
   * @description Vérifie et modère les messages selon la phase du concours
   * @param {Message} message - Message Discord à vérifier
   * @returns {Promise<void>}
   */
  async verifierMessage(message) {
    if (message.channel.isThread() && message.channel.parentId === process.env.CHANNEL_CONCOUR_ID) {
      console.log(`[DEBUG] Message reçu dans le thread ${message.channel.name} (Phase: ${await this.getPhaseCourante(message.channel)})`);
      
      const phase = await this.getPhaseCourante(message.channel);
      
      switch(phase) {
        case this.phases.A_VENIR:
          if (!message.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            console.log(`[MODERATION] Message ${message.id} supprimé - non modérateur`);
            await message.delete();
          }
          console.log(`[DEBUG] Verrouillage thread ${message.channel.id}`);
          this.verrouillerThread(message.channel);
          break;
        
        case this.phases.PARTICIPATION:
          if (!message.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            if (message.attachments.size === 0) {
              console.log(`[MODERATION] Message ${message.id} supprimé - pas de pièce jointe`);
              await message.delete();
            } else {
              console.log(`[MODERATION] Réactions nettoyées pour le message ${message.id}`);
              await message.reactions.removeAll();
            }
          }
          break;
        
        case this.phases.VOTE:
          if (!message.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            if (message.content || message.attachments.size > 0) {
              console.log(`[MODERATION] Message ${message.id} supprimé - contenu non autorisé`);
              await message.delete();
            } else {
              console.log(`[VOTE] Réaction ${REACT_EMOJI} ajoutée au message ${message.id}`);
              await message.react(REACT_EMOJI);
            }
          }
          break;

        // Correction d'une variable non définie dans la phase TERMINE
        case this.phases.TERMINE:
          const thread = message.channel;
          const topMessages = await this.calculerResultats(thread);
          
          // Vérification du nombre de participants
          if (topMessages.length < 3) {
            console.log(`[RESULTATS] Seulement ${topMessages.length} participants - attribution annulée`);
            return;
          }

          const [premier, second, troisieme] = topMessages;
          
          try {
            // Validation des auteurs avant attribution des rôles
            if (premier?.author) {
              const member = await message.guild.members.fetch(message.author.id);
              await member.roles.add(process.env.TROPHY_ROLE_FIRST);
              console.log(`[REWARD] Role 1er attribué à ${premier.author.username}`);
            } else {
              console.error('[ERREUR] Auteur du message gagnant introuvable', premier?.id);
            }

            if (second?.author) {
              await second.author.roles.add(process.env.TROPHY_ROLE_SECOND);
              console.log(`[REWARD] Role 2nd attribué à ${second.author.username}`);
            }

            if (troisieme?.author) {
              await troisieme.author.roles.add(process.env.TROPHY_ROLE_THIRD);
              console.log(`[REWARD] Role 3e attribué à ${troisieme.author.username}`);
            }
          } catch (e) {
            console.error('[ERREUR] Attribution des rôles échouée', e.stack);
          }

          const messageResultats = `Il est ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. La phase de vote est terminée, voici les résultats !\n` +
            `|| <@&${process.env.TAG_ID_AVENIR}> ||\n\n` +
            `#######################################################################  message pour le 3E\n` +
            `> Avec ___${troisieme.reactions.cache.get(process.env.REACT_EMOJI)?.count || 0} votes___, c'est ${troisieme.author.username} qui remporte la 3e place !\n\n` +
            `#######################################################################  message pour le 2ND\n` +
            `> Avec ___${second.reactions.cache.get(process.env.REACT_EMOJI)?.count || 0} votes___, c'est ${second.author.username} qui se positionne 2nd !\n\n` +
            `#######################################################################  message pour le 1ER\n` +
            `> Et enfin, avec ___${premier.reactions.cache.get(process.env.REACT_EMOJI)?.count || 0} votes___, c'est ${premier.author.username} qui remporte le concours !`;

          const canalNews = this.client.channels.cache.get(process.env.CHANNEL_NEWS_ID);
          await canalNews.send(messageResultats);
          break;
      }
    }
  }

  async calculerResultats(thread) {
    console.log(`[RESULTATS] Calcul des résultats pour le thread ${thread.id}`);
    const messages = await thread.messages.fetch();
    
    return messages.filter(m => m.attachments.size > 0)
      .sort((a, b) => b.reactions.cache.get(process.env.REACT_EMOJI)?.count - a.reactions.cache.get(process.env.REACT_EMOJI)?.count)
      .first(3);
  }

  async gererTransitionPhase(thread, nouvellePhase) {
    if (!thread?.id || !thread.name) {
      console.error('[ERREUR] Thread invalide pour transition', thread?.id);
      return;
    }
    
    const nomPhase = Object.keys(this.phases).find(k => this.phases[k] === nouvellePhase);
    console.log(`[PHASE] Transition pour ${thread.name} (${thread.id}) vers ${nomPhase}`);
    console.log('[DEBUG] Metadata thread:', {
      archived: thread.archived,
      locked: thread.locked,
      tags: thread.appliedTags
    });
    
    try {
      await thread.setLocked(nouvellePhase === this.phases.TERMINE);
      await thread.setAppliedTags([nouvellePhase]);

      if (nouvellePhase === this.phases.PARTICIPATION) {
        const messages = await thread.messages.fetch();
        for (const message of messages.values()) {
          await message.reactions.removeAll().catch(console.error);
        }
        console.log(`[MODERATION] Toutes les réactions supprimées pour le thread ${thread.id}`);
      }
    } catch (e) {
      console.error('[ERREUR] Échec mise à jour thread', thread.id, e.stack);
      throw new Error(`Échec transition phase: ${e.message}`);
    }
    
    // Formatage de date localisé
const formatterDateLocale = (locale) => {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

const messages = {
  fr: `Phase **${Object.keys(this.phases).find(k => this.phases[k] === nouvellePhase)}** activée !\n` +
      `Prochaine transition: **${formatterDateLocale('fr-FR').format(this.getDateProchainePhase(nouvellePhase, thread))}**`,
  en: `Phase **${Object.keys(this.phases).find(k => this.phases[k] === nouvellePhase)}** started!\n` +
      `Next transition: **${formatterDateLocale('en-US').format(this.getDateProchainePhase(nouvellePhase, thread))}**`
};

const messageTransition = `${messages.fr}\n\n${messages.en}`;
    
    console.log(`[PHASE] Message de transition envoyé: ${messageTransition}`);
    await thread.send(messageTransition);
  }


  /**
   * @method getDateProchainePhase
   * @description Détermine la date de la prochaine phase du concours
   * @param {string} phase - Identifiant de la phase actuelle
   * @param {ThreadChannel} thread - Thread du concours
   * @returns {Date} Date estimée de la prochaine phase
   * @throws {Error} Si le format de date est invalide
   */
  getDateProchainePhase(phase, thread) {
    if (!thread?.name) {
      console.error('[ERREUR] Thread invalide ID:', thread?.id);
      return new Date(Date.now() + 604800000);
    }

    const dateMatch = thread.name.match(/\[(\d{4}[\/\-]\d{2}[\/\-]\d{2})\]/);
    console.log('[DEBUG] Extraction date thread:', { nom: thread.name, match: dateMatch });
if (!dateMatch) {
      console.error('[ERREUR] Format date incorrect dans le thread:', {
        id: thread.id,
        nom: thread.name
      });
      return new Date(Date.now() + 604800000);
    }

    try {
      const dateString = dateMatch[1].replace(/\D/g, '-');
      // Ajout d'un formatage de secours
      const dateConcours = new Date(dateString + 'T12:00:00Z');
      if (isNaN(dateConcours)) {
        console.error('[FALLBACK] Utilisation date système');
        return new Date(Date.now() + 604800000);
      }

      if (isNaN(dateConcours.getTime())) {
        throw new Error('Date invalide après parsing');
      }

      console.log('[DEBUG] Date UTC validée:', dateConcours.toISOString());
      const durees = {
  [this.phases.A_VENIR]: 86400000, // 24h
  [this.phases.PARTICIPATION]: 172800000, // 48h
  [this.phases.VOTE]: 259200000, // 72h
  [this.phases.TERMINE]: 0
};
const dureePhase = durees[phase] || 604800000;
console.log('[DEBUG] Durée phase:', { phase, duree: dureePhase });

      console.log('[DEBUG] Calcul date phase:', {
        phase,
        dateBase: dateConcours.toUTCString(),
        dureeAjoutee: dureePhase,
        nouvelleDate: new Date(dateConcours.getTime() + dureePhase).toUTCString()
      });

      return new Date(dateConcours.getTime() + dureePhase);
    } catch (e) {
      console.error('[ERREUR] Parsing date échoué:', e.message);
      return new Date(Date.now() + 604800000);
    }
  }

  async getPhaseCourante(thread) {
    const phase = thread.appliedTags[0];
    console.log(`[DEBUG] Phase courante pour ${thread.name}: ${phase}`);
    return phase;
  }

  /**
   * @method verrouillerThread
   * @description Verrouille et archive un thread
   * @param {ThreadChannel} thread - Thread à verrouiller
   * @returns {Promise<void>}
   */
  verrouillerThread(thread) {
    thread.setLocked(true);
    thread.setArchived(true);
  }
}

module.exports = GestionConcours;