require("dotenv").config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, Collection, GatewayIntentBits, REST, Routes} = require('discord.js');
const { AppConfig } = require('./app/app.config');
const { Config } = require("./app/models/config");

const token = AppConfig.DISCORD_BOT_TOKEN;
const clientId = AppConfig.DISCORD_BOT_CLIENT_ID;

async function main(){

    // Create a new client instance
    const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
    ] });


    // When the client is ready, run this code (only once)
    // We use 'c' for the event parameter to keep it separate from the already defined 'client'
    client.once(Events.ClientReady, c => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    client.on(Events.MessageCreate, async message => {
        const config = loadConfig(message.guildId);
        if(message.author.id === config.authorID && message.content.includes(config.splitter)){
            const split = message.content.split(config.splitter);
            // console.log("Splitting...");
            if(split.length > 1) {
                // find config for the twitter user that is being posted
                const tracker = config.trackers.find(element => split[1].includes(`twitter.com/${element.twitter}`));
                if(tracker){
                    // console.info(`${split.length} - ${split[1]}`);
                    const channel = await client.channels.fetch(tracker.channelID);
                    if(channel){
                        channel.send({ content: `<@&${tracker.roleID}> ${split[1]}` });
                    }
                }
            }
        }
    });

    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.isChatInputCommand() && client.commands != undefined){
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else {
            return;
        }
    });

    // Log in to Discord with your client's token
    client.login(token);    
    await publishCommands(client);
}

/**
 * 
 * @param {Client} client 
 */
async function publishCommands(client){

    client.commands = new Collection();
    const commandsJSON = [];
    const commandsPath = path.join(__dirname, 'app', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsJSON.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    const guildIds = ["866887704234950666"]
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);
    // and deploy your commands!
    (async () => {
        try {
            console.log(`Started refreshing ${commandsJSON.length} application (/) commands.`);
            // // The put method is used to fully refresh all commands in the guild with the current set
            // // const data = await rest.put(
            // //     Routes.applicationGuildCommands(clientId, guildId),
            // //     { body: commandsJSON },
            // // );
            // console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            for(let guildId of guildIds){
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commandsJSON },
                );
            }
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commandsJSON },
            );
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
}

/**
 * 
 * @returns {Config} The saved config for the server.
 */
function loadConfig(guildID){
    const filePath = path.join(__dirname, 'configs', `${guildID}.json`);
    const config = JSON.parse(fs.readFileSync(filePath));
    return config;
}

main();