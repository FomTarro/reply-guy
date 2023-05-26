require("dotenv").config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, Collection, GatewayIntentBits, REST, Routes} = require('discord.js');
const { AppConfig } = require('./app/app.config');

async function main(){

    // Create a new client instance
    const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
    ] });

    const token = AppConfig.DISCORD_BOT_TOKEN;
    const clientId = AppConfig.DISCORD_CLIENT_ID;

    // When the client is ready, run this code (only once)
    // We use 'c' for the event parameter to keep it separate from the already defined 'client'
    client.once(Events.ClientReady, c => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    /* TODO: 
        3. Make the channel we post to configurable
        4. Make a role to ping configurable
    */
    client.on(Events.MessageCreate, async message => {
        const filePath = path.join(__dirname, 'configs', `${message.guildId}.json`);
        const config = JSON.parse(fs.readFileSync(filePath));
        if(message.author.id === config.author.id 
        && message.content.includes(config.splitter)){
            console.log(message.content);
            const split = message.content.split(config.splitter);
            if(split.length > 1) {
                console.info(`${split.length} - ${split[1]}`);
                message.reply({ content: split[1]});
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

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);
    // and deploy your commands!
    (async () => {
        try {
            console.log(`Started refreshing ${commandsJSON.length} application (/) commands.`);
            // The put method is used to fully refresh all commands in the guild with the current set
            // const data = await rest.put(
            //     Routes.applicationGuildCommands(clientId, guildId),
            //     { body: commandsJSON },
            // );
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
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

main();