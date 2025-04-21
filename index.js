const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const GestionConcours = require('./concours.js');
const GestionThreads = require('./threads.js');
const { REST, Routes } = require('discord.js');
const commands = require('./commands.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.Guilds
  ]
});
const YouTubeMonitor = require('./youtubeMonitor.js');
const youtubeMonitor = new YouTubeMonitor(client);
youtubeMonitor.initialize();

const gestionConcours = new GestionConcours(client);
const gestionThreads = new GestionThreads();

client.on('threadUpdate', async (oldThread, newThread) => {
  if (newThread.parentId !== process.env.CHANNEL_CONCOUR_ID) return;
  
  const oldTags = oldThread.appliedTags;
  const newTags = newThread.appliedTags;
  
  if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
    const oldPhase = oldTags[0];
    const currentPhase = newTags[0];
    const phaseOrder = Object.values(gestionConcours.phases);
    
    console.log('[TRANSITION] Tentative de transition:', { oldPhase, currentPhase });
    
    if (phaseOrder.indexOf(oldPhase) + 1 === phaseOrder.indexOf(currentPhase)) {
      console.log('[TRANSITION] Transition valide vers', currentPhase);
      await gestionConcours.gererTransitionPhase(newThread, currentPhase);
    } else {
      console.warn('[TRANSITION] Transition non autorisée', 
        { sequence_attendue: phaseOrder.join(' -> ') });
    }
  }
});

client.on('messageCreate', async (message) => {
  await gestionConcours.verifierMessage(message);
});

client.on('threadCreate', async (thread) => {
  if (thread.parentId === process.env.CHANNEL_CONCOUR_ID) {
    await gestionThreads.creerThreadSemaine(thread.parent);
  }
});

client.on('newVideo', ({ video, username, channelId }) => {
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(`**${username}** a publié une nouvelle vidéo\nhttps://www.youtube.com/watch?v=${video.id.videoId}`);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'add-youtube') {
    await youtubeCommand.execute(interaction);
  }
});

// Remplacer la section d'enregistrement des commandes
client.on('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.CLIENT_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map(cmd => cmd.data.toJSON()) }
        );
        console.log('Commandes slash enregistrées avec succès');
    } catch (error) {
        console.error('Erreur enregistrement commandes:', error);
    }
});

// Modifier le gestionnaire d'interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    const command = commands.find(cmd => cmd.data.name === interaction.commandName);
    if (command) {
        await command.execute(interaction);
    }
});

client.login(process.env.CLIENT_TOKEN);