var ipc = require('electron').ipcMain;
var messageParser = require('../../page_parser').message;
var Promise = require('bluebird');

function MessagesHandler(sessionHandler) {
    this.session_handler = sessionHandler;
}

MessagesHandler.prototype.loadConversations = function() {
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.CONVERSATIONS_API)
        .then(messageParser.parseMessagesList);
};

MessagesHandler.prototype.loadConversation = function(id) {
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_API + id)
        .then(messageParser.parseConversation);
};

MessagesHandler.prototype.sendMessage = function(id, content) {
    return this.session_handler.openRequest(function(request) {
        return request.post({
            url: PROXER_BASE_URL + PROXER_PATHS.MESSAGE_WRITE_API + id,
            form: { message: content }
        });
    }).then(messageParser.parseMessagePostResponse);
};

MessagesHandler.prototype.refreshMessages = function(id) {
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.MESSAGE_NEW_API + id)
        .then(messageParser.parseNewMessages);
};

MessagesHandler.prototype.register = function() {
    var self = this;
    ipc.on('conversations', function(event) {
        self.loadConversations().then(function(result) {
            event.sender.send('conversations', result);
        });
    });

    ipc.on('conversation', function(event, id) {
        self.loadConversation(id).then(function(result) {
            event.sender.send('conversation', result);
        });
    });

    ipc.on('conversation-write', function(event, id, message) {
        self.sendMessage(id, message).then(function(result) {
            event.sender.send('conversation-write', result);
        });
    });

    ipc.on('conversation-update', function(event, id) {
        self.refreshMessages(id).then(function(result) {
            event.sender.send('conversation-update', result);
        });
    });
};

module.exports = MessagesHandler;
