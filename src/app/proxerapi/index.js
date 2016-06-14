const SessionHandler = require('./session_handler');
const LoginHandler = require('./login_handler');
const ProfileHandler = require('./profile_handler');
const WatchlistHandler = require('./watchlist_handler');
const NewsHandler = require('./news_handler');
const LoginChecker = require('./login_checker');
const MessageHandler = require('./message_handler');
const EpisodeHandler = require('./episode_handler');
const db = require('../db');

function API(app, cookiePath) {
    this.session_handler = new SessionHandler(app, cookiePath, db);
    this.login_handler = new LoginHandler(this.session_handler);
    this.login_checker = new LoginChecker(app, this.session_handler, this.login_handler, db);
    this.handers = [
        new ProfileHandler(this.session_handler),
        new WatchlistHandler(app, this.session_handler),
        new NewsHandler(this.session_handler),
        new MessageHandler(app, this.session_handler),
        new EpisodeHandler(this.session_handler)
    ];
}

API.prototype.init = function() {
    this.login_handler.register();
    this.handers.forEach(function(elem) { elem.register(); });
    return this.session_handler.loadState();
};

module.exports = API;
