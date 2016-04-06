const ipc = require('electron').ipcMain;
const loginParser = require('../../page_parser').login;
const Promise = require('bluebird');
const _ = require('lodash');
const pageUtils = require('./page_utils');

function LoginHandler(sessionHandler) {
    this.session_handler = sessionHandler;
}

LoginHandler.prototype.login = function(username, password, keepLogin = false) {
    const self = this;
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.ROOT)
        .then(loginParser.parseLogin)
        .then(function(result) {
            if(result.status === 'logged-in') {
                LOG.verbose('Already logged in.');
                return { success: true, reason: 'already-logged-in' };
            } else if(result.status === 'logged-out'){
                LOG.verbose('Not logged in yet, sending login with following details:');
                LOG.verbose('Username: ' + username + '; Pass: ' + (password || password.length == 0 ? 'No' : '****'));
                return Promise.resolve(result.data).then(function(data) {
                    return _.merge(data, {
                        username: username,
                        password: password,
                        remember: keepLogin ? 'yes' : 'no'
                    });
                }).then(function(formData) {
                    return self.session_handler.openRequest(function(request) {
                        return request.post({
                            url: PROXER_BASE_URL + PROXER_PATHS.LOGIN,
                            form: formData
                        });
                    })
                }).catch(function(error) {
                    if(error.statusCode === 303) {
                        const location = error.response.headers.location;
                        if(location === '/' || location === 'https://proxer.me/') {
                            LOG.info("Logged in");
                            return { success: true, reason: null };
                        } else {
                            LOG.warn('Couldn\'t login, invalid info.');
                            return { success: false, reason: 'invalid' };
                        }
                    } else {
                        LOG.warn('There was an issue with logging in:');
                        LOG.warn(error);
                        return { success: false, reason: 'error' };
                    }
                });
            } else {
                LOG.warn('Could not determine if user is already logged in or not');
                return { success: false, reason: 'error' };
            }
        });
};

LoginHandler.prototype.logout = function() {
    const self = this;
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.ROOT)
        .then(loginParser.parseLogout)
        .then(function(result) {
            if(result.status === 'logged-out') {
                LOG.verbose('Already logged out.');
                return { success: true, reason: 'already-logged-in' };
            } else if(result.status === 'logout'){
                LOG.verbose('Still logged in, logging out.');
                return Promise.resolve(result.data).then(function(formData) {
                    return self.session_handler.openRequest(function(request) {
                        return request.post({
                            url: PROXER_BASE_URL + PROXER_PATHS.LOGOUT,
                            form: formData
                        });
                    });
                }).catch(function(error) {
                    if(error.statusCode === 303) {
                        LOG.info('Logged out.');
                        return { success: true, reason: null };
                    } else {
                        LOG.warn('There was an issue with logging out:');
                        LOG.warn(error);
                        return { success: false, reason: 'error' };
                    }
                });
            } else {
                LOG.warn('Could not determine if user is already logged put or not');
                return { success: false, reason: 'error' };
            }
        });
};

LoginHandler.prototype.checkLogin = function() {
    return this.session_handler.openRequest(PROXER_BASE_URL + PROXER_PATHS.API_LOGIN)
        .then(loginParser.parseLoginCheck);
};

LoginHandler.prototype.register = function() {
    const self = this;
    ipc.on('login', function(event, user, keepLogin) {
        self.login(user.username, user.password, keepLogin).then(function(result) {
            event.sender.send('login', result);
        });
    });

    ipc.on('logout', function(event) {
        self.logout().then(function(result) {
            event.sender.send('logout', result);
        });
    });

    ipc.on('check-login', function(event) {
        self.checkLogin().then(function(result) {
            event.sender.send('check-login', result);
        });
    });
};

module.exports = LoginHandler;
