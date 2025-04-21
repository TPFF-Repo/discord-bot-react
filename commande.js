const { SlashCommandBuilder } = require('discord.js');

class PurgeCommand {
    constructor() {
        this.data = new SlashCommandBuilder()
            .setName('purge')
            .setDescription('Supprime un nombre spécifié de messages')
            .addIntegerOption(option =>
                option.setName('nombre')
                    .setDescription('Nombre de messages à supprimer (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            );
    }

    async execute(interaction) {
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
}

module.exports = new PurgeCommand();