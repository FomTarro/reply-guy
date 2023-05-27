const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Tracker, Config } = require('../models/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settracker')
		.setDescription('Set up tracking options.')
		.addUserOption(option =>
			option.setName('author')
				.setDescription('The original poster to listen for messages from.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('twitter')
				.setDescription('The twitter account to split on.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('splitter')
				.setDescription('The string to split messages on.')
				.setRequired(true))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to post the new messages in.')
				.setRequired(true))
		.addRoleOption(option =>
			option.setName('role')
				.setDescription('The role to ping with new messages.')
				.setRequired(true)),
	/**
	 * 
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const author = interaction.options.getUser('author');
		const twitter = interaction.options.getString('twitter');
		const splitter = interaction.options.getString('splitter');
		const channel = interaction.options.getChannel('channel');
		const role = interaction.options.getRole('role');
		const filePath = path.join(__dirname, '..', '..', 'configs', `${interaction.guildId}.json`);
		if(!fs.existsSync(filePath)){
			const config = new Config(author.id, splitter, [new Tracker(twitter, channel.id, role.id)]);
			fs.writeFileSync(filePath, JSON.stringify(config));
		}else{
			const config = JSON.parse(fs.readFileSync(filePath));
			if(config.trackers){
				const existingTracker = config.trackers.findIndex(element => element.twitter === twitter);
				if(existingTracker){
					config.trackers[existingTracker] = new Tracker(twitter, channel.id, role.id);
				}else{
					config.trackers.push(new Tracker(twitter, channel.id, role.id));
				}
			}else{
				const config = new Config(author, splitter, [new Tracker(twitter, channel.id, role.id)]);
			}
			fs.writeFileSync(filePath, JSON.stringify(config));
		}
		await interaction.reply(`Listening for posts from ${author} for Twitter account ${twitter} that contain the splitter: ${splitter}`);
	},
};