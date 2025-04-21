const { SlashCommandBuilder } = require('@discordjs/builders');
const YouTubeMonitor = require('./youtubeMonitor');
const fs = require('fs/promises');

module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName('purge')
            .setDescription('Supprime un nombre spécifié de messages')
            .addIntegerOption(option =>
                option.setName('nombre')
                    .setDescription('Nombre de messages à supprimer (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)),
        execute: async (interaction) => {
            if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
                return interaction.reply({
                    content: '❌ Permission refusée - Rôle modérateur requis',
                    ephemeral: true
                });
            }
    
            const amount = interaction.options.getInteger('nombre');
    
            try {
                const messages = await interaction.channel.bulkDelete(amount, true);
                await interaction.reply({
                    content: `✅ ${messages.size} messages supprimés avec succès`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('[ERREUR PURGE]', error);
                await interaction.reply({
                    content: '❌ Échec de la suppression des messages',
                    ephemeral: true
                });
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('add-youtube-channel')
            .setDescription('Ajoute une chaîne YouTube à surveiller')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Nom de la chaîne YouTube')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
              return interaction.reply({
                content: '❌ Permission refusée - Rôle modérateur requis',
                ephemeral: true
              });
            }
            const input = interaction.options.getString('username');
            
            if(input.match(/^<@!?\d+>$/)) {
              return interaction.reply({
                content: '❌ Utilisation incorrecte! Veuillez spécifier un **nom de chaîne YouTube** et non une mention Discord\nExemple: `/add-youtube-channel CodingTech`',
                ephemeral: true
              });
            }

            try {
              const channelId = await YouTubeMonitor.getChannelId(input);
              if (!channelId) throw new Error('Chaîne non trouvée');
          
              const channels = JSON.parse(await fs.readFile('./youtubeChannels.json'));
              
              if (channels.some(ch => ch.id === channelId)) {
                return interaction.reply({
                  content: '❌ Cette chaîne est déjà surveillée !',
                  ephemeral: true
                });
              }
          
              channels.push({ id: channelId, username: input });
              await fs.writeFile('./youtubeChannels.json', JSON.stringify(channels, null, 2));
              
              interaction.reply({
                content: `✅ Chaîne **${input}** ajoutée avec succès !`,
                ephemeral: true
              });
            } catch (error) {
              console.error(error);
              const errorMessage = error.message.includes('non trouvée') 
                ? `Chaîne "${input}" non trouvée. Vérifiez l'orthographe et l'existence de la chaîne.`
                : `Erreur technique: ${error.message}`;
              
              interaction.reply({
                content: `❌ ${errorMessage}\n\nAstuce: Utilisez le nom de chaîne exact ou son ID YouTube`,
                ephemeral: true
              });
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('remove-youtube-channel')
            .setDescription('Supprime une chaîne YouTube de la surveillance')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Nom de la chaîne YouTube à supprimer')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
                return interaction.reply({
                  content: '❌ Permission refusée - Rôle modérateur requis',
                  ephemeral: true
                });
              }
              const username = interaction.options.getString('username');
              
              try {
                const channels = JSON.parse(await fs.readFile('./youtubeChannels.json'));
                const index = channels.findIndex(ch => ch.username === username);
                
                if (index === -1) {
                  return interaction.reply('Cette chaîne n\'est pas surveillée !');
                }
          
                channels.splice(index, 1);
                await fs.writeFile('./youtubeChannels.json', JSON.stringify(channels, null, 2));
                
                interaction.reply(`Chaîne ${username} supprimée avec succès !`);
              } catch (error) {
                console.error(error);
                interaction.reply('Erreur lors de la suppression de la chaîne : ' + error.message);
              }
        }
    }
];