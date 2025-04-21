const { ThreadChannel } = require('discord.js');
const { TAG_ID_AVENIR, CHANNEL_CONCOUR_ID } = process.env;

class GestionThreads {
  constructor() {
    this.threads = new Map();
  }

  async creerThreadSemaine(parentChannel) {
    const dateConcours = new Date(Date.now() + 86400000); // Décalage de 24h
    dateConcours.setUTCHours(12, 0, 0, 0); // Fixé à 12:00 UTC
    const annee = dateConcours.getUTCFullYear();
    const mois = String(dateConcours.getUTCMonth() + 1).padStart(2, '0');
    const jour = String(dateConcours.getUTCDate()).padStart(2, '0');
    const nomThread = `[${annee}/${mois}/${jour}] - Concours Hebdomadaire`;
    
    const thread = await parentChannel.threads.create({
      name: nomThread, 
      autoArchiveDuration: 1440,
      reason: 'Nouveau concours hebdomadaire',
      appliedTags: [TAG_ID_AVENIR]
    });

    console.log(`[THREAD] Nouveau thread créé - ID: ${thread.id} | Date: ${dateConcours.toISOString()}`);

    this.threads.set(thread.id, {
      phase: TAG_ID_AVENIR,
      verrouille: true
    });

    await thread.send('Thread de concours créé ! Phase "À Venir" activée.');
    return thread;
  }

  async archiverThread(thread) {
    console.log(`[THREAD] Archivage du thread ${thread.id}`);
    await thread.setArchived(true);
    await thread.setLocked(true);
    this.threads.delete(thread.id);
    console.log(`[THREAD] Thread ${thread.id} supprimé de la mémoire`);
  }

  getThreadInfo(threadId) {
    return this.threads.get(threadId);
  }
}

module.exports = GestionThreads;