/**
 * The save data for the app.
 */
class Config {
    /**
     * @param {string} authorID The ID of the poster to listen for in the server.
     * @param {string} splitter The character or string to split on.
     * @param {Tracker[]} trackers List of trackers The name of the author.
     */
    constructor(authorID, splitter, trackers){
        this.authorID = authorID;
        this.splitter = splitter;
        this.trackers = trackers;
    }
}

class Tracker {
    /**
     * 
     * @param {string} twitter The Twitter account to listen for.
     * @param {string} channelID The channel ID to post in.
     * @param {string} roleID The role ID to ping.
     */
    constructor(twitter, channelID, roleID){
        this.twitter = twitter;
        this.channelID = channelID;
        this.roleID = roleID;
    }
}

module.exports.Config = Config
module.exports.Tracker = Tracker