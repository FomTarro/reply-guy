const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Set up tracking options.')
		.addUserOption(option =>
			option.setName('author')
				.setDescription('The original poster to listen for messages from.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('splitter')
				.setDescription('The string to split messages on.')
				.setRequired(true)),
	async execute(interaction) {
		const author = interaction.options.getUser('author');
		const splitter = interaction.options.getString('splitter');
		const filePath = path.join(__dirname, '..', '..', 'configs', `${interaction.guildId}.json`);
		const config = {
			author: author,
			splitter: splitter
		}
		fs.writeFileSync(filePath, JSON.stringify(config));
		await interaction.reply(`Listening for posts from ${author} that contain the splitter: ${splitter}`);
	},
};