const winston = require('winston');
const path = require('path');
const moment = require('moment');

global.APP_NAME = "proxtop";
global.PROXER_BASE_URL = "https://proxer.me";
global.INDEX_LOCATION = path.join(__dirname, "../index.html");
global.LOGO_RELATIVE_PATH = "assets/proxtop_logo_256.png";
global.LOGO_LOCATION = path.join(__dirname, "../", LOGO_RELATIVE_PATH);
global.PROXER_PATHS = {
    ROOT: '/',
    LOGIN: '/component/user/?task=user.login',
    API_LOGIN: '/login?format=json&action=login',
    WATCHLIST: '/ucp?s=reminder',
    OWN_PROFILE: '/user',
    NEWS: '/news',
    NEWS_API: '/notifications?format=json&s=news&p=1',
    CONVERSATIONS_API: '/messages/?format=json&json=conferences',
    CONVERSATION_PAGE: '/messages/?id=',
    CONVERSATION_FAVORITES: '/messages/favourite',
    CONVERSATION_MARK_FAVORITE: '/messages/?format=json&json=favour&id=',
    CONVERSATION_UNMARK_FAVORITE: '/messages/?format=json&json=unfavour&id=',
    CONVERSATION_MARK_BLOCKED: '/messages/?format=json&json=block&id=',
    CONVERSATION_UNMARK_BLOCKED: '/messages/?format=json&json=unblock&id=',
    CONVERSATION_REPORT: '/messages/?s=report&format=raw&id=',
    CONVERSATION_NEW_CONFERENCE: "/messages/?format=json&json=newConference",
    CONVERSATION_NEW: "/messages/?format=json&json=new",
    MESSAGE_API: '/messages/?format=json&json=messages&id=',
    MESSAGE_NEW_API: '/messages/?format=json&json=newmessages&id=',
    MESSAGE_WRITE_API: '/messages/?format=json&json=answer&id=',
    MESSAGE_NOTIFICATIONS: '/messages?format=raw&s=notification',
    WATCH_ANIME: '/watch/%d/%d/%s',
    VIEW_MANGA: '/chapter/%d/%d/%s',
    LOGOUT: '/component/users/?task=user.logout',
    DELETE_WATCHLIST: '/ucp?format=json&type=deleteReminder&id='
};

global.ERRORS = require('./util/errors');
global.UPDATE_INTERVALL = 2 * 60 * 60 * 1000;
global.GITHUB_RELEASES_URL = "https://api.github.com/repos/kumpelblase2/proxtop/releases";
global.UPDATER_FEED_URL = "https://proxtop.eternalwings.de/update/";

try {
    global.APP_DIR = path.join(require("electron").app.getPath("appData"), APP_NAME);
} catch(e) {
    global.APP_DIR = path.join(__dirname, '..', '..', APP_NAME);
}

const logPath = path.join(APP_DIR, "app.log");
console.log("Setting logfile to " + logPath);
global.LOG = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'silly',
            timestamp: function() {
                return new Date();
            },
            formatter: function(options) {
                return '[' + options.level.toLowerCase() + '][' + moment(options.timestamp()).format("DD.MM.YYYY HH:mm:ss:SS") + '] ' +
                    (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )
            }
        }),
        new (winston.transports.File)({
            filename: logPath
        })
    ]
});
