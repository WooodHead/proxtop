const messageParser = require('../../page_parser').message;
const Promise = require('bluebird');
const translate = require('../translation');
const IPCHandler = require('./ipc_handler');
const { MessageCache } = require('../storage');

class MessagesHandler extends IPCHandler {
    constructor(app, sessionHandler) {
        super();
        this.app = app;
        this.session_handler = sessionHandler;
        this.settings = require('../settings');
        this.lastCheck = 0;
        this.translation = translate();
    }

    loadConversations() {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATIONS_API)
            .then(messageParser.parseMessagesList);
    }

    loadFavorites() {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_FAVORITES)
            .then(messageParser.parseFavoriteMessages);
    }

    favoriteMessage(id) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_MARK_FAVORITE + id)
            .then(messageParser.parseMarkFavorite).then(function(result) {
                result.id = id;
                return result;
            });
    }

    unfavoriteMessage(id) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_UNMARK_FAVORITE + id)
            .then(messageParser.parseMarkFavorite).then(function(result) {
                result.id = id;
                return result;
            });
    }

    blockConversation(id) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_MARK_BLOCKED + id)
            .then(messageParser.parseMarkBlocked).then(function(result) {
                result.id = id;
                return result;
            });
    }

    unblockConversation(id) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_UNMARK_BLOCKED + id)
            .then(messageParser.parseMarkBlocked).then(function(result) {
                result.id = id;
                return result;
            });
    }

    reportConversation(id) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_REPORT + id)
            .then(messageParser.parseReported).then((result) => {
                result.id = id;
                return result;
            });
    }

    loadConversation(id) {
        return Promise.join(this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_API + id).then(messageParser.parseConversation),
                this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATION_PAGE + id).then(messageParser.parseConversationPage),
            (conversation, participants) => {
                conversation.participants = participants;
                return conversation;
            }
        );
    }

    loadPreviousMessages(id, page) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_API + id + "&p=" + page)
            .then(messageParser.parseConversation);
    }

    sendMessage(id, content) {
        return this.session_handler.openRequest(function(request) {
            return request.post({
                url: PROXER_BASE_URL + PROXER_PATHS.MESSAGE_WRITE_API + id,
                form: { message: content }
            });
        }).then(messageParser.parseMessagePostResponse);
    }

    refreshMessages(id, last_id = 0) {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_NEW_API + id + "&mid=" + last_id)
            .then(messageParser.parseNewMessages);
    }

    checkNotifications() {
        return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_NOTIFICATIONS)
            .then(messageParser.parseMessagesNotification);
    }

    messageCheckLoop() {
        setTimeout(() => {
            this.messageCheck();
            this.messageCheckLoop();
        }, 30000);
    }

    messageCheck() {
        const self = this;
        const enabled = self.settings.getGeneralSettings().message_notification;
        if(!enabled) {
            MessageCache.clear();
            return;
        }

        const interval = self.settings.getGeneralSettings().check_message_interval;
        const time = new Date().getTime();
        if(time - self.lastCheck > interval * 60000 - 5000) {
            this.lastCheck = time;
            LOG.info("Check if new messages have arrived...");
            self.checkNotifications().then((notifications) => {
                notifications.forEach((notification) => {
                    if(!MessageCache.hasReceived(notification.username)) {
                        LOG.verbose('Got new message from ' + notification.username);
                        self.app.displayNotification({
                            type: 'new-message',
                            title: 'Proxtop',
                            content: self.translation.get('MESSAGES.NEW_MESSAGE', { user: notification.username }),
                            icon: 'assets/proxtop_logo_256.png'
                        });
                    }
                });

                MessageCache.clear();
                notifications.forEach((not) => MessageCache.markReceived(not.username));
            });
        }
    }

    register() {
        this.handle('conversations', this.loadConversations);
        this.handle('conversation', this.loadConversation);
        this.handle('conversation-write', this.sendMessage);
        this.handle('conversation-update', this.refreshMessages);
        this.handle('conversation-more', this.loadPreviousMessages);
        this.handle('conversations-favorites', this.loadFavorites);
        this.handle('conversation-favorite', this.favoriteMessage);
        this.handle('conversation-unfavorite', this.unfavoriteMessage);
        this.handle('conversation-block', this.blockConversation);
        this.handle('conversation-unblock', this.unblockConversation);
        this.handle('conversation-report', this.reportConversation);

        this.messageCheckLoop();
    }
}

module.exports = MessagesHandler;
