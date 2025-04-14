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
});
  
  

const concours = require('./concours.js');
const screenshot = require('./screenshot.js');
const threads = require('./threads.js');

// Configuration des modules
concours.setup(client);
screenshot.setup(client);
threads.setup(client);

client.login(process.env.CLIENT_TOKEN);