require("dotenv").config();

class AppConfig {
    get ENV(){ return process.env.NODE_ENV || 'local'; };
    get PORT(){ return process.env.PORT || 8080; };
    get DOMAIN(){ return process.env.domain || `http://localhost:${this.PORT}` };
    get DISCORD_BOT_TOKEN(){return process.env.BOT_TOKEN};
    get DISCORD_BOT_CLIENT_ID(){return process.env.BOT_CLIENT_ID};
    get DISCORD_BOT_NAME(){return 'reply-guy'};
}

const instance = new AppConfig();

module.exports.AppConfig = instance;